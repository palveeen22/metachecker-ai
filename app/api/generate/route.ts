import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchMetadata } from "@/shared/lib/metadata";
import type {
  MetadataResult,
  MissingField,
  GeneratedMetadata,
} from "@/shared/lib/metadata";
import {
  ValidationError,
  ConfigurationError,
  ExternalServiceError,
  toErrorResponse,
  logger,
} from "@/shared/lib";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getModel() {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    },
  });
}

function buildPrompt(
  existingMetadata?: MetadataResult,
  prompt?: string,
): string {
  const base = `You are an expert SEO consultant and metadata specialist. Analyze the webpage content and existing metadata, then provide:

1. **Complete optimized metadata** following best practices
2. **Detailed analysis** of what's missing or needs improvement
3. **Actionable recommendations** with clear reasoning

CRITICAL RULES:
- For images (ogImage, twitterImage, favicon, etc): NEVER generate fake URLs or placeholder values
- Instead, provide recommendations like: "Should be a 1200x630px image showcasing [description]"
- Only include actual image URLs if they exist in the current metadata
- Be specific and actionable in all recommendations
- Consider the actual page content and context

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "metadata": {
    // Basic SEO
    "title": "Compelling, keyword-rich title (50-60 chars)",
    "description": "Persuasive meta description with clear value prop (150-160 chars)",
    "keywords": "primary keyword, secondary keyword, long-tail keyword",
    "author": "Author name if applicable",
    "generator": "Generator if applicable",
    "themeColor": "#hex-color for brand",

    // Open Graph - Critical for social sharing
    "ogTitle": "Engaging OG title (may differ from SEO title)",
    "ogDescription": "Compelling OG description (may differ from meta)",
    "ogImage": null,  // NEVER generate fake URLs
    "ogImageWidth": null,
    "ogImageHeight": null,
    "ogImageAlt": "Descriptive alt text for OG image",
    "ogUrl": "canonical URL",
    "ogType": "website or article",
    "ogSiteName": "Brand/site name",
    "ogLocale": "en_US or appropriate locale",
    "ogVideo": null,  // Only if video exists
    "ogAudio": null,  // Only if audio exists

    // Facebook
    "fbAppId": null,  // Only if FB integration exists
    "fbPages": null,
    "fbDomainVerification": null,

    // Twitter Cards - Critical for Twitter sharing
    "twitterCard": "summary_large_image",
    "twitterTitle": "Twitter-optimized title",
    "twitterDescription": "Twitter-optimized description",
    "twitterImage": null,  // NEVER generate fake URLs
    "twitterImageAlt": "Descriptive alt text for Twitter image",
    "twitterSite": "@username if applicable",
    "twitterCreator": "@username if applicable",
    "twitterDomainVerification": null,

    // Technical SEO
    "canonicalUrl": "canonical URL",
    "robots": "index, follow",
    "viewport": "width=device-width, initial-scale=1",
    "charset": "UTF-8",
    "language": "en or appropriate lang code",
    "favicon": null,  // Only if exists
    "appleTouchIcon": null,  // Only if exists
    "manifest": null,  // Only if exists

    // Article Specific (if type is article)
    "articlePublishedTime": null,
    "articleModifiedTime": null,
    "articleAuthor": null,
    "articleSection": null,
    "articleTags": null,

    // Additional SEO
    "alternateUrls": null,
    "prevPage": null,
    "nextPage": null,
    "rating": null,
    "referrer": "origin-when-cross-origin",

    // Discord & Slack (uses OG by default)
    "discordTitle": "same as ogTitle",
    "discordDescription": "same as ogDescription",
    "discordImage": null,
    "discordType": "same as ogType",
    "slackTitle": "same as ogTitle",
    "slackDescription": "same as ogDescription",
    "slackImage": null,
    "slackType": "same as ogType"
  },

  "aiAnalysis": {
    "missingFields": [
      {
        "field": "ogImage",
        "importance": "critical",
        "reason": "Social media platforms will not display rich previews without an image",
        "recommendation": "Create a 1200x630px image with your logo, key message, and brand colors. Use tools like Canva or Figma. Image should be under 8MB and in JPG/PNG format."
      }
    ],
    "improvements": [
      "Current title is too generic - make it more specific and include primary keyword",
      "Description lacks a clear call-to-action",
      "Missing structured data (JSON-LD) for better search appearance"
    ],
    "seoScore": 75,  // Score out of 100
    "summary": "Overall assessment and priority actions"
  }
}`;

  if (existingMetadata) {
    return `${base}

**CURRENT PAGE METADATA:**
${JSON.stringify(existingMetadata, null, 2)}

**YOUR TASK:**
1. Analyze what's missing, weak, or incorrect
2. Generate IMPROVED versions of all fields
3. Provide specific, actionable recommendations
4. For images: describe what SHOULD be there, don't generate fake URLs
5. Explain WHY each change improves SEO/social sharing
6. Give a realistic SEO score and improvement roadmap

Focus on:
- Making titles more compelling and click-worthy
- Writing descriptions that drive action
- Ensuring all critical fields for social sharing are optimized
- Identifying technical SEO issues
- Providing clear next steps for the user`;
  }

  if (prompt) {
    return `${base}

**USER REQUEST:**
${prompt}

**YOUR TASK:**
Generate complete, professional metadata for a webpage about: "${prompt}"

Consider:
- Target audience and search intent
- Competitive keywords
- Social media best practices
- Technical SEO requirements
- Brand voice and tone

Provide actionable recommendations for each field, especially for images and technical setup.`;
  }

  return base;
}

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new ConfigurationError("Gemini API key is not configured");
    }

    const { url, prompt } = await request.json();

    if (!url && !prompt) {
      throw new ValidationError("URL or prompt is required");
    }

    let existingMetadata: MetadataResult | undefined;
    if (url) {
      try {
        logger.info("Fetching existing metadata for generation", { url });
        existingMetadata = await fetchMetadata(url);
      } catch (error) {
        logger.warn(
          "Failed to fetch existing metadata, continuing with generation",
          { url },
        );
      }
    }

    logger.info("Generating metadata with Gemini", {
      url,
      hasPrompt: !!prompt,
    });
    const geminiPrompt = buildPrompt(existingMetadata, prompt);
    const model = getModel();
    const result = await model.generateContent(geminiPrompt);
    const textContent = result.response.text();

    if (!textContent) {
      throw new ExternalServiceError("gemini", "No response from AI");
    }

    // Clean and parse JSON response
    let jsonString = textContent
      .replace(/```json?\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Handle cases where AI wraps response in extra text
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    let aiResponse: {
      metadata: MetadataResult;
      aiAnalysis: GeneratedMetadata["aiAnalysis"];
    };

    try {
      aiResponse = JSON.parse(jsonString);
    } catch {
      throw new ExternalServiceError(
        "gemini",
        "Failed to parse AI response. The AI returned invalid JSON.",
      );
    }

    const generatedMetadata: GeneratedMetadata = {
      ...aiResponse.metadata,
      aiAnalysis: aiResponse.aiAnalysis,
    };

    // Preserve existing technical fields that AI cannot generate
    if (existingMetadata) {
      // Keep actual URLs and technical data
      generatedMetadata.ogImage = existingMetadata.ogImage;
      generatedMetadata.ogImageWidth = existingMetadata.ogImageWidth;
      generatedMetadata.ogImageHeight = existingMetadata.ogImageHeight;
      generatedMetadata.twitterImage = existingMetadata.twitterImage;
      generatedMetadata.favicon = existingMetadata.favicon;
      generatedMetadata.appleTouchIcon = existingMetadata.appleTouchIcon;
      generatedMetadata.manifest = existingMetadata.manifest;
      generatedMetadata.canonicalUrl = existingMetadata.canonicalUrl;
      generatedMetadata.ogUrl =
        existingMetadata.ogUrl || existingMetadata.canonicalUrl;
      generatedMetadata.sitemapUrl = existingMetadata.sitemapUrl;
      generatedMetadata.sitemapExists = existingMetadata.sitemapExists;
      generatedMetadata.robotsTxtExists = existingMetadata.robotsTxtExists;
      generatedMetadata.robotsTxtContent = existingMetadata.robotsTxtContent;
      generatedMetadata.alternateUrls = existingMetadata.alternateUrls;
      generatedMetadata.prevPage = existingMetadata.prevPage;
      generatedMetadata.nextPage = existingMetadata.nextPage;

      // Update Discord/Slack with generated OG values if no image exists
      generatedMetadata.discordTitle = generatedMetadata.ogTitle;
      generatedMetadata.discordDescription = generatedMetadata.ogDescription;
      generatedMetadata.discordImage = existingMetadata.ogImage;
      generatedMetadata.discordType = generatedMetadata.ogType;
      generatedMetadata.slackTitle = generatedMetadata.ogTitle;
      generatedMetadata.slackDescription = generatedMetadata.ogDescription;
      generatedMetadata.slackImage = existingMetadata.ogImage;
      generatedMetadata.slackType = generatedMetadata.ogType;

      // Add image recommendations if missing
      if (!existingMetadata.ogImage && generatedMetadata.aiAnalysis) {
        const hasImageRecommendation =
          generatedMetadata.aiAnalysis.missingFields.some(
            (f) => f.field === "ogImage",
          );

        if (!hasImageRecommendation) {
          generatedMetadata.aiAnalysis.missingFields.push({
            field: "ogImage",
            importance: "critical",
            reason:
              "Social media platforms require images for rich previews. Without an OG image, your links will appear as plain text, significantly reducing click-through rates.",
            recommendation:
              "Create a 1200x630px image (aspect ratio 1.91:1) featuring your logo, primary message, and brand colors. Optimal file size: under 8MB. Formats: JPG or PNG. Tools: Canva, Figma, or Adobe Express. Ensure text is readable when scaled down to thumbnail size.",
          });
        }
      }

      if (!existingMetadata.twitterImage && generatedMetadata.aiAnalysis) {
        const hasTwitterImageRec =
          generatedMetadata.aiAnalysis.missingFields.some(
            (f) => f.field === "twitterImage",
          );

        if (!hasTwitterImageRec) {
          generatedMetadata.aiAnalysis.missingFields.push({
            field: "twitterImage",
            importance: "high",
            reason:
              "Twitter uses its own image tag for card previews. Falls back to OG image, but dedicated Twitter images can be optimized for the platform.",
            recommendation:
              "Use the same 1200x630px image as OG image, or create a Twitter-specific version optimized for the platform's audience. Consider adding Twitter handle or hashtag to the image.",
          });
        }
      }

      if (!existingMetadata.favicon && generatedMetadata.aiAnalysis) {
        generatedMetadata.aiAnalysis.missingFields.push({
          field: "favicon",
          importance: "medium",
          reason:
            "Favicon appears in browser tabs, bookmarks, and mobile home screens. Missing favicon makes your site look unprofessional.",
          recommendation:
            "Create a 32x32px (minimum) or 512x512px (recommended) square icon in ICO, PNG, or SVG format. Use your logo or brand mark. Ensure it's recognizable at small sizes. Generate multiple sizes (16x16, 32x32, 192x192, 512x512) for best cross-platform support.",
        });
      }
    }

    // Ensure boolean fields have defaults
    generatedMetadata.sitemapExists = generatedMetadata.sitemapExists ?? false;
    generatedMetadata.robotsTxtExists =
      generatedMetadata.robotsTxtExists ?? false;

    logger.info("Metadata generated successfully", {
      url,
      hasPrompt: !!prompt,
    });
    return NextResponse.json(generatedMetadata);
  } catch (error) {
    logger.error("Metadata generation failed", error, {
      route: "/api/generate",
    });
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

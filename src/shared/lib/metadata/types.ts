export interface MetadataResult {
  // Basic SEO
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  generator?: string;
  themeColor?: string;

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  ogImageAlt?: string;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;
  ogLocale?: string;
  ogVideo?: string;
  ogAudio?: string;

  // Facebook
  fbAppId?: string;
  fbPages?: string;
  fbDomainVerification?: string;

  // Twitter Cards
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterImageAlt?: string;
  twitterSite?: string;
  twitterCreator?: string;
  twitterDomainVerification?: string;

  // Technical
  canonicalUrl?: string;
  robots?: string;
  viewport?: string;
  charset?: string;
  language?: string;
  favicon?: string;
  appleTouchIcon?: string;
  manifest?: string;

  // Article Specific
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  articleSection?: string;
  articleTags?: string;

  // Additional SEO
  alternateUrls?: { [key: string]: string };
  prevPage?: string;
  nextPage?: string;
  rating?: string;
  referrer?: string;

  // Sitemap
  sitemapUrl?: string;
  sitemapExists: boolean;
  robotsTxtExists: boolean;
  robotsTxtContent?: string;

  // Discord
  discordTitle?: string;
  discordDescription?: string;
  discordImage?: string;
  discordType?: string;

  // Slack
  slackTitle?: string;
  slackDescription?: string;
  slackImage?: string;
  slackType?: string;
}

export interface MissingField {
  field: string;
  importance: "critical" | "high" | "medium" | "low";
  reason: string;
  recommendation: string;
}

export interface AiAnalysis {
  missingFields: MissingField[];
  improvements: string[];
  seoScore: number;
  summary: string;
}

export interface GeneratedMetadata extends MetadataResult {
  aiAnalysis?: AiAnalysis;
}

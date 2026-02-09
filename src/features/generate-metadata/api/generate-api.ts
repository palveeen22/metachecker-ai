import { apiClient } from "@/shared/api";
import type { GeneratedMetadata } from "@/shared/lib/metadata";

export interface GenerateInput {
  url?: string;
  prompt?: string;
}

export async function generateMetadata(
  input: GenerateInput,
): Promise<GeneratedMetadata> {
  return apiClient<GeneratedMetadata>("/generate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

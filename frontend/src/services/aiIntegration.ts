import { ClaimType } from "@/types";

export interface AiDocumentPayload {
  claimType: ClaimType;
  fileName: string;
  mimeType: string;
}

export interface AiQuestionPayload {
  question: string;
  role?: string;
}

export const aiIntegration = {
  async classifyDocument(_payload: AiDocumentPayload) {
    return {
      mode: "mock",
      message: "Frontend is prepared for future backend AI document classification."
    };
  },
  async askAssistant(_payload: AiQuestionPayload) {
    return {
      mode: "mock",
      message: "Frontend is prepared for future grounded assistant API integration."
    };
  }
};

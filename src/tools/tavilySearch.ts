import { tool } from "langchain";
import { TavilySearch } from "@langchain/tavily";
import { z } from "zod";

const tavilyApiKey = process.env.TAVILY_API_KEY;
if (!tavilyApiKey) {
  throw new Error("TAVILY_API_KEY environment variable is not set");
}

export const internetSearch = tool(
  async ({
    query,
    maxResults = 5,
    topic = "general",
    includeRawContent = false,
  }: {
    query: string;
    maxResults?: number;
    topic?: "general" | "news" | "finance";
    includeRawContent?: boolean;
  }) => {
    const searchTool = new TavilySearch({
      maxResults,
      tavilyApiKey,
      includeRawContent,
      topic,
    });
    return await (searchTool as any).invoke({ query });
  },
  {
    name: "internet_search",
    description: "Run a web search",
    schema: z.object({
      query: z.string().describe("The search query"),
      maxResults: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of results to return"),
      topic: z
        .enum(["general"])
        .optional()
        .default("general")
        .describe("Search topic category"),
      includeRawContent: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to include raw content"),
    }),
  },
);

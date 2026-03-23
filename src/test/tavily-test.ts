import { TavilySearch } from "@langchain/tavily";

const tavilyApiKey = process.env.TAVILY_API_KEY;

if (!tavilyApiKey) {
  console.error("TAVILY_API_KEY environment variable is not set");
  process.exit(1);
}

async function testSearch() {
  console.log("Testing Tavily Search...\n");

  const searchTool = new TavilySearch({
    maxResults: 3,
    tavilyApiKey: tavilyApiKey as string,
    includeAnswer: true,
    includeRawContent: false,
  });

  const testQueries = [
    "best beaches in Cantabria Spain",
    "things to do near Serdio Cantabria",
    "Picos de Europa tourism",
  ];

  for (const query of testQueries) {
    console.log(`Query: "${query}"`);
    console.log("-".repeat(50));

    try {
      const result = await (searchTool as any).invoke({ query });
      console.log(result);
      console.log("=".repeat(50));
      console.log();
    } catch (error: any) {
      console.error("Error:", error.message || error);
      console.log("=".repeat(50));
      console.log();
    }
  }
}

testSearch();

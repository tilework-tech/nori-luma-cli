export interface LumaConfig {
  apiKey: string;
}

export function loadConfig(): LumaConfig {
  const apiKey = process.env.LUMA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LUMA_API_KEY environment variable is required.\n" +
        "Get your API key from: Luma App -> Calendars Home -> Settings -> Developer -> API Keys\n" +
        "Set it with: export LUMA_API_KEY=your-key-here"
    );
  }
  return { apiKey };
}

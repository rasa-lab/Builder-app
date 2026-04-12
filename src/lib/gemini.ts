import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function* streamWebsiteGeneration(contents: any[]) {
  const response = await ai.models.generateContentStream({
    model: "gemini-3.1-pro-preview",
    contents: contents,
    config: {
      systemInstruction: `You are an expert frontend developer and website builder. 
Your task is to generate a single, complete HTML file based on the user's request.
The HTML file MUST include Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>).
Include any necessary JavaScript within <script> tags.
Use standard SVGs for icons.
Return ONLY the raw HTML code enclosed in \`\`\`html ... \`\`\` blocks. Do not include any other text or explanation.`,
      temperature: 0.2,
      maxOutputTokens: 8192,
    }
  });

  for await (const chunk of response) {
    yield chunk.text;
  }
}

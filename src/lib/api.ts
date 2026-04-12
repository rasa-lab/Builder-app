import { GoogleGenAI } from "@google/genai";

export interface ApiKeys {
  gemini: string;
  openrouter: string;
  grok: string;
  github?: string;
}

const SYSTEM_INSTRUCTION = `You are an expert full-stack developer, UI/UX designer, and software architect. 
Your task is to generate a complete, production-ready project based on the user's request.
You can create multiple files (HTML, CSS, JS, TS, Python, etc.).

CRITICAL REQUIREMENTS FOR "SMART" GENERATION:
1. DESIGN: Use modern, professional UI/UX principles. Implement responsive design (mobile-first), proper spacing, typography, and color theory. Use Tailwind CSS for styling unless specified otherwise.
2. CODE QUALITY: Write clean, modular, and maintainable code. Use best practices, handle errors gracefully, and add necessary comments.
3. COMPLETENESS: Do not leave placeholders like "<!-- content here -->". Provide a fully working, interactive prototype.
4. LOGIC: If the user asks for complex logic (e.g., backend, database, state management), implement it robustly.
5. UPDATING FILES: You will be provided with the current files. You can modify them by providing the new content. To DELETE a file, provide the filename but leave the content completely empty.

IMPORTANT FORMAT:
1. First, provide a brief, professional summary of what you built, the features included, and how it works. Speak in Indonesian if the user speaks Indonesian.
2. Then, provide the code for each file. You MUST use the following format for EVERY file:

\`\`\`[language] filename: [path/to/file.ext]
[file content here]
\`\`\`

Example:
\`\`\`html filename: index.html
<!DOCTYPE html>
...
\`\`\`

\`\`\`tsx filename: src/components/Dashboard.tsx
import React from 'react';
...
\`\`\`

Do not include any other text after the code blocks.`;

export async function* streamWebsiteGeneration(
  contents: any[],
  model: string,
  apiKeys: ApiKeys,
  currentFiles: Record<string, string> = {}
) {
  const fileContext = Object.keys(currentFiles).length > 0 
    ? `\n\nCURRENT FILES IN PROJECT:\n${Object.entries(currentFiles).map(([name, content]) => `\`\`\`${name.split('.').pop()} filename: ${name}\n${content}\n\`\`\``).join('\n')}\n\nYou can modify these files or create new ones. If you are fixing an error, provide the updated file content.`
    : '';

  const finalSystemInstruction = SYSTEM_INSTRUCTION + fileContext;

  if (model.startsWith("gemini")) {
    const key = apiKeys.gemini || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Gemini API key is missing.");
    
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.2,
        maxOutputTokens: 8192,
      }
    });

    for await (const chunk of response) {
      yield chunk.text;
    }
  } else if (model.startsWith("grok")) {
    const key = apiKeys.grok;
    if (!key) throw new Error("Grok API key is missing. Please configure it in Settings.");
    
    yield* streamOpenAIFormat(
      "https://api.x.ai/v1/chat/completions",
      key,
      model,
      contents,
      finalSystemInstruction
    );
  } else {
    // OpenRouter
    const key = apiKeys.openrouter;
    if (!key) throw new Error("OpenRouter API key is missing. Please configure it in Settings.");
    
    yield* streamOpenAIFormat(
      "https://openrouter.ai/api/v1/chat/completions",
      key,
      model,
      contents,
      finalSystemInstruction,
      {
        "HTTP-Referer": window.location.href,
        "X-Title": "X BUILDER"
      }
    );
  }
}

async function* streamOpenAIFormat(
  endpoint: string,
  apiKey: string,
  model: string,
  contents: any[],
  systemInstruction: string,
  extraHeaders: Record<string, string> = {}
) {
  // Convert contents to OpenAI format
  const messages = [
    { role: "system", content: systemInstruction },
    ...contents.map(c => ({
      role: c.role === "model" ? "assistant" : "user",
      content: c.parts[0].text
    }))
  ];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      ...extraHeaders
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      stream: true,
      temperature: 0.2,
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error (${response.status}): ${err}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              yield data.choices[0].delta.content;
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  }
}

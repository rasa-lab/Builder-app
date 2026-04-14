import { GoogleGenAI } from "@google/genai";

export async function* streamWebsiteGeneration(
  contents: any[], 
  selectedModel: string, 
  apiKeys: Record<string, string>, 
  currentFiles: Record<string, string>, 
  projectMode: string
) {
  let apiKey = '';
  let modelName = selectedModel;
  let baseUrl = undefined;

  if (selectedModel.startsWith('gemini')) {
    apiKey = apiKeys.gemini || (import.meta as any).env.VITE_GEMINI_API_KEY || '';
  } else if (selectedModel.startsWith('gpt')) {
    apiKey = apiKeys.openai || '';
  } else if (selectedModel.includes('claude') || selectedModel.includes('openrouter')) {
    apiKey = apiKeys.openrouter || '';
    baseUrl = 'https://openrouter.ai/api/v1';
  } else if (selectedModel.startsWith('grok')) {
    apiKey = apiKeys.grok || '';
    baseUrl = 'https://api.x.ai/v1';
  } else if (selectedModel.startsWith('deepseek')) {
    apiKey = apiKeys.deepseek || '';
    baseUrl = 'https://api.deepseek.com/v1';
  } else if (selectedModel.startsWith('qwen')) {
    apiKey = apiKeys.qwen || '';
    baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  } else if (selectedModel.startsWith('custom')) {
    apiKey = apiKeys.customEndpoint || '';
    // Assuming custom endpoint logic is handled elsewhere or needs a specific setup
  }

  // Fallback to Gemini if no API key is provided for the selected model but Gemini key exists
  if (!apiKey && apiKeys.gemini) {
    apiKey = apiKeys.gemini;
    modelName = 'gemini-3.1-pro-preview';
  }

  if (!apiKey) {
    throw new Error("API Key tidak ditemukan. Silakan tambahkan di Pengaturan.");
  }

  // We use GoogleGenAI for Gemini models. For others, we'd need OpenAI SDK or fetch.
  // For simplicity in this fix, we'll assume GoogleGenAI works for Gemini, 
  // and we'll use standard fetch for OpenAI-compatible endpoints.
  
  const systemInstruction = projectMode === 'apk' 
    ? `You are an expert Android developer.
Your task is to generate the necessary files for an Android Studio project based on the user's request.
You MUST return the code in Markdown blocks, and each block MUST specify the filename using this exact format:
\`\`\`[language] filename: [path/to/file.ext]
[code]
\`\`\`
Example:
\`\`\`xml filename: app/src/main/res/layout/activity_main.xml
<LinearLayout ...>
\`\`\`
Always include at least MainActivity.java (or .kt) and activity_main.xml.`
    : `You are an expert frontend developer and website builder. 
Your task is to generate the necessary files for a web project based on the user's request.
You MUST return the code in Markdown blocks, and each block MUST specify the filename using this exact format:
\`\`\`[language] filename: [filename.ext]
[code]
\`\`\`
Example:
\`\`\`html filename: index.html
<!DOCTYPE html>...
\`\`\`
If it's a single file, name it index.html. Include Tailwind CSS via CDN if needed.`;

  if (modelName.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 8192,
      }
    });

    for await (const chunk of response) {
      yield chunk.text;
    }
  } else {
    // OpenAI Compatible API fallback
    const response = await fetch(baseUrl ? `${baseUrl}/chat/completions` : 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemInstruction },
          ...contents.map(c => ({
            role: c.role === 'model' ? 'assistant' : 'user',
            content: c.parts.map((p: any) => p.text).join('\n')
          }))
        ],
        stream: true,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices[0].delta.content) {
                yield data.choices[0].delta.content;
              }
            } catch (e) {}
          }
        }
      }
    }
  }
}

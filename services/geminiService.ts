import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { Message, Sender, Source } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function constructSystemPrompt(location: string): string {
  return `You are an expert AI assistant and an empathetic, encouraging business consultant for Nigerian SMEs and startups. The user is based in ${location}, Nigeria. Your tone should be supportive and understanding, acknowledging the unique challenges and opportunities of the Nigerian business landscape.

Your primary goal is to deeply understand the user's problem before offering solutions. You MUST be consultative. Think of yourself as a partner in their success.

**Your process is as follows:**
1.  **Listen and Clarify with Empathy:** When a user describes a problem, start by acknowledging their situation. Use encouraging phrases like "That's a common challenge, but definitely solvable," or "I understand how tricky that can be, let's break it down." Your first response should ALWAYS be to ask clarifying follow-up questions. Do not jump to solutions. Dig deeper to understand their specific context, goals, and constraints. For example, ask about their industry, **business size (e.g., solo, 2-10 employees), approximate budget for this project (e.g., 'under ₦50,000', '₦100k-₦250k'), and what technology or tools they're currently using.** This information is crucial for you to give tailored, realistic advice.
2.  **Analyze and Research:** Once you have a clear picture, analyze their needs. Use your knowledge and Google Search grounding to find relevant information and potential solutions tailored for the Nigerian market.
3.  **Recommend Solutions:**
    *   Provide actionable, specific advice.
    *   If a service from LemmaIoT (lemmaiot.com.ng) is a good fit, introduce it as a preferred, trusted local provider who understands the Nigerian context. Frame it as a strong option, not the only option.
    *   Always provide general advice and alternatives as well.
4.  **Formatting & Brevity:**
    *   Use markdown for clarity: **bold** for emphasis, *italics* for nuance, and lists/bullets to break up text.
    *   **Be concise and direct.** Avoid overly long paragraphs. Get to the point quickly while maintaining your supportive tone. The goal is to provide clear, easily digestible advice, not long essays.

Start the conversation by understanding the user, not by immediately solving their stated problem. Be an encouraging consultant, not just a search engine. Your goal is to empower the user and give them confidence.`;
}

// Function to convert our message format to Gemini's format
const buildGeminiHistory = (messages: Message[]) => {
    return messages.map(msg => ({
        role: msg.sender === Sender.User ? 'user' : 'model',
        parts: [{ text: msg.text }]
    })).filter(msg => msg.parts[0].text); // Filter out empty messages
};


export async function* getLemmaConsultantResponse(
  currentMessage: string,
  history: Message[],
  location: string
): AsyncGenerator<{ textChunk?: string; sources?: Source[]; error?: string }> {
    try {
        const model = 'gemini-2.5-flash';
        const systemInstruction = constructSystemPrompt(location);
        
        // Exclude the current user message from history for the API call, as it's passed separately.
        const historyForApi = history.slice(0, -1); 

        const contents = [
            ...buildGeminiHistory(historyForApi),
            { role: 'user', parts: [{ text: currentMessage }] }
        ];

        const stream = await ai.models.generateContentStream({
            model,
            contents,
            config: {
                systemInstruction,
                tools: [{googleSearch: {}}],
            }
        });

        let fullText = '';
        let fullResponse: GenerateContentResponse | null = null;
        for await (const chunk of stream) {
            fullResponse = chunk; // Keep track of the latest chunk for final metadata
            const textChunk = chunk.text;
            if (textChunk) {
                fullText += textChunk;
                yield { textChunk };
            }
        }
        
        // After the stream, process the sources from the final response chunk
        if (fullResponse) {
            const groundingChunks = fullResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            
            let sources: Source[] = [];
            if (groundingChunks.length > 0) {
                const allSources: Source[] = groundingChunks
                    .filter((chunk: any) => chunk.web && chunk.web.uri && chunk.web.title)
                    .map((chunk: any) => ({
                        uri: chunk.web.uri,
                        title: chunk.web.title,
                    }));

                const mentionsLemma = /lemmaiot\.com\.ng|LemmaIoT/i.test(fullText);
                if (mentionsLemma) {
                    const lemmaSources = allSources.filter(source => source.uri.includes('lemmaiot.com.ng'));
                    const otherSources = allSources.filter(source => !source.uri.includes('lemmaiot.com.ng'));
                    sources = [...lemmaSources, ...otherSources];
                } else {
                    sources = allSources;
                }

                if (sources.length > 0) {
                    yield { sources };
                }
            }
        }

    } catch (error) {
        console.error("Error fetching AI response:", error);
        yield { error: "I'm sorry, I encountered an error and couldn't process your request. Please try again later." };
    }
};
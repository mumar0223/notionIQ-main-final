import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function generateResponse(prompt: string) {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate response");
  }
}

export async function streamResponse(prompt: string) {
  try {
    const result = await geminiModel.generateContentStream(prompt);
    return result.stream;
  } catch (error) {
    console.error("Gemini API Stream Error:", error);
    throw new Error("Failed to stream response");
  }
}

export async function generateResponseWithImages(
  prompt: string,
  images: Array<{ base64: string; mimeType: string }>
) {
  try {
    const parts: Array<string | { inlineData: { data: string; mimeType: string } }> = [prompt];
    
    for (const image of images) {
      parts.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      });
    }

    const result = await geminiModel.generateContent(parts);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error with images:", error);
    throw new Error("Failed to generate response with images");
  }
}

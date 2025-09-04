import { useState } from "react";

export function useGeminiGenerateTaskWithImage(apiKey) {
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [aiImageTasks, setAiImageTasks] = useState([]);
  const [imageError, setImageError] = useState(null);

  async function generateTasksFromImage(base64Image) {
    if (!base64Image) return;

    setIsImageLoading(true);
    setImageError(null);
    setAiImageTasks([]);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`;

    const prompt = `
Use OCR to extract text from the provided WhatsApp conversation screenshots and generate a JSON task list with the following structure:

1. category (broad task classification like 'Travel', 'Household', 'Finance', etc.)
2. sub_category (specific task type, determined by AI based on the conversation, e.g., 'Flight Booking', 'Staff Management')
3. category_tag (brief descriptor summarizing the task context, e.g., 'Domestic', 'Urgent')
4. description (brief explanation of the task)
5. client_name (name of the person assigning the task)
6. time_assigned (time from the conversation in 12:00 format)
7. expected_closure (task completion deadline, suggest appropriate task completion time in format of dd/mm/yyyy)
8. task_subject (five words short description of the task)

Ensure sub_category and category_tag are intelligently inferred from the conversation context.
`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/png", // or "image/jpeg"
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Gemini API error");
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      const cleanedText = rawText
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .trim();

      // Match JSON array
      const jsonMatch = cleanedText.match(/\[\s*{[\s\S]*?}\s*\]/);

      if (!jsonMatch) {
        setImageError("Could not find valid JSON in AI response.");
        return;
      }

      let parsedTasks = [];
      try {
        const extractedJson = jsonMatch[0];
        const decoded = JSON.parse(extractedJson);

        parsedTasks = Array.isArray(decoded) ? decoded : [decoded];
        setAiImageTasks(parsedTasks);
      } catch (e) {
        console.error("JSON parsing failed:", e.message);
        setImageError("Failed to parse AI output as JSON");
      }

      return parsedTasks;
    } catch (e) {
      setImageError(e.message);
      return null;
    } finally {
      setIsImageLoading(false);
    }
  }

  return { isImageLoading, aiImageTasks, imageError, generateTasksFromImage };
}

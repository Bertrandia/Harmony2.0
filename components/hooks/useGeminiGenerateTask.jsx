import { useState } from "react";

export function useGeminiGenerateTask(apiKey) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiTasks, setAiTasks] = useState([]);
  const [error, setError] = useState(null);

  async function generateTasks(taskInput) {
    if (!taskInput) return;

    setIsLoading(true);
    setError(null);
    setAiTasks([]);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`;

    const prompt = `
From the given conversation summary generate a JSON task list with the following structure:

1. category
2. sub_category
3. category_tag
4. description
5. client_name
6. time_assigned
7. expected_closure
8. task_subject

Ensure sub_category and category_tag are intelligently inferred. If time is not given, use current local time, and if expected closure is not given, use tomorrow's date.

Conversation summary:
${taskInput}
`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
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

      const rawText = data?.candidates?.[0]?.content.parts[0].text || "";

      const cleanedText = rawText
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .trim();

      

      // Match the first JSON array in the text
      const jsonMatch = cleanedText.match(/\[\s*{[\s\S]*?}\s*\]/);

      if (!jsonMatch) {
        setError("Could not find valid JSON in AI response.");
        return;
      }

      let parsedTasks = [];
      try {
        const extractedJson = jsonMatch[0];
        

        const decoded = JSON.parse(extractedJson);

        if (Array.isArray(decoded)) {
          parsedTasks = decoded;
        } else {
          parsedTasks = [decoded];
        }

        setAiTasks(parsedTasks);
      } catch (e) {
        console.error("JSON parsing failed:", e.message);
        setError("Failed to parse AI output as JSON");
      }

      return parsedTasks;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, aiTasks, error, generateTasks };
}

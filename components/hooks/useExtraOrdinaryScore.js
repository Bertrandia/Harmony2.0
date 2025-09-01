import { useState } from "react";

export function useExtraOrdinaryScore(apiKey) {
  const [extraOrdinaryScore, setExtraOrdinaryScore] = useState(null);

  const generateExtraOrdinaryScore = async (task) => {
    const GEMINI_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=" +
      apiKey;

    const taskJson = JSON.stringify(task);
    const prompt = `
${taskJson} Analyze the JSON task and score it (extraordinary score) as an integer from 1 to 10.
- 7–10: Very hard / unique / thoughtful tasks
- 3–6: Regular life tasks
- 1–3: Extremely simple / easy tasks
Return only the integer value without quotes.
    `;

    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      const score = parseInt(text, 10) || 5;
      setExtraOrdinaryScore(score);
      return score;
    } catch (err) {
      console.error("ExtraOrdinaryScore API Error:", err);
      setExtraOrdinaryScore(5); // fallback
      return 5;
    }
  };

  return { extraOrdinaryScore, generateExtraOrdinaryScore };
}

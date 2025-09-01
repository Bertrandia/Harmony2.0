import { useState } from "react";

export function useValueScore(apiKey) {
  const [valueScore, setValueScore] = useState(null);

  const generateValueScore = async (task) => {
    const GEMINI_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=" +
      apiKey;

    const taskJson = JSON.stringify(task);
    const prompt = `
${taskJson}
You are an assistant that calculates the *value generated for a patron* by a Lifestyle Manager
when completing a task. Evaluate carefully and return only a single integer value (in minutes).

Consider strictly:
1. **Time Saved** – Direct minutes/hours the patron would have spent if they did the task themselves.
2. **Mental Effort** – Minutes equivalent to decision-making, research, or analysis done on behalf of the patron.
3. **Stress Reduction & Convenience** – Approximate minutes representing reduced stress, hassle, or coordination effort for the patron.
4. **Additional Value** – Negotiations, special arrangements, or multi-party coordination converted into equivalent time saved.

Rules:
- Convert everything into a single integer value in minutes.
- Be conservative but realistic. Avoid exaggeration.
- Return only the integer number. No text, no explanation.
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

      const score = parseInt(text, 10) || 15; // fallback default = 15 mins
      setValueScore(score);
      return score;
    } catch (err) {
      console.error("ValueScore API Error:", err);
      setValueScore(15); // fallback
      return 15;
    }
  };

  return { valueScore, generateValueScore };
}

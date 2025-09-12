import { useState } from "react";

/**
 * Hook: useExtractInvoiceNumber
 * @param {string} apiKey - Gemini API key
 *
 * Usage:
 * const { loading, error, extractInvoiceNumber } = useExtractInvoiceNumber(apiKey);
 */
export function useExtractInvoiceNumber(apiKey) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Extract invoice number from a base64 image or PDF text.
   * @param {Object} params
   * @param {string} [params.base64Image]
   * @param {string} [params.pdfText]
   * @returns {Promise<string>} - Invoice number or "" if none found
   */
  const extractInvoiceNumber = async ({ base64Image, pdfText }) => {
    if (!base64Image && !pdfText) return "";

    setLoading(true);
    setError("");

    const prompt = base64Image
      ? `
You are given an invoice image (in Base64).
Your task is to extract the **invoice number**, or if not present the **Bill Number/No.**.
Return only the invoice number without extra text.

Base64:
${base64Image}
    `
      : `
You are given extracted text from a PDF invoice.
Extract the **invoice number** from it (always from the first page).
Return only the invoice number without any extra text.

Text:
${pdfText}
    `;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const raw =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

      const match = raw.match(/[A-Za-z0-9-]+/);
      return match ? match[0] : "";
    } catch (err) {
      setError(err.message);
      return "";
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, extractInvoiceNumber };
}

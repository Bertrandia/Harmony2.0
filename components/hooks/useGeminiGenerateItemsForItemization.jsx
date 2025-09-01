import { useState } from "react";

export function useGeminiGenerateItemsForItemization(apiKey) {
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [error, setError] = useState(null);

  async function generateItemsForItemization(invoiceInput) {
    if (!invoiceInput) return;

    setIsLoading(true);
    setError(null);
    setInvoiceData(null);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`;

    const prompt = `
Instructions:
Visual Analysis: Carefully examine the invoice text for all visible text.  

Data Extraction: Identify and extract the following data:  
- If there are multiple invoices present, only extract the number of the first invoice and the rest of the details will be in the single json (not in array).  

Required fields:  
Invoice Number, Invoice Description (2–3 AI sentences), Invoice Date, Item Details (with item_name, item_description [if missing, AI 5-word summary], item_unit, item_quantity, item_rate, item_preTaxAmount, item_cgst, item_sgst, item_igst, gst_amount, cess_amount, item_total, hsn_snc).  

Invoice Totals: pretax_amount, cgst_amount, sgst_amount, igst_amount, other_charges, total_amount.  

Formatting:  
- All numeric values must be formatted to two decimals.  
- All calculations must be consistent.  
- Output must be a **single valid JSON object only**.  

Example Output Format:
{
  "invoice_number": "INV-12345",
  "invoice_description": "AI-generated overview of the invoice",
  "invoice_date": "2023-12-25",
  "pretax_amount": "500.00",
  "cgst_amount": "50.00",
  "sgst_amount": "50.00",
  "igst_amount": "0.00",
  "other_charges": "20.00",
  "total_amount": "620.00",
  "items": [
    {
      "item_name": "Product A",
      "item_description": "AI-generated description",
      "item_quantity": "2",
      "item_unit": "kg",
      "item_preTaxAmount": "200.00",
      "item_rate": "100.00",
      "item_total": "220.00",
      "item_cgst": "10.00",
      "item_sgst": "10.00",
      "item_igst": "0.00",
      "gst_amount": "20.00",
      "cess_amount": "0.00",
      "hsn_snc": "123456"
    }
  ]
}

Strictly give me only the JSON output, nothing else.  

Invoice Text:
${invoiceInput}
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
            temperature: 0.3,
            maxOutputTokens: 1200,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Gemini API error");
      }

      const data = await res.json();

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Clean up quotes and whitespace
      const cleanedText = rawText
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .trim();

      // Extract JSON block (from first { to last })
      const firstBrace = cleanedText.indexOf("{");
      const lastBrace = cleanedText.lastIndexOf("}");

      if (firstBrace === -1 || lastBrace === -1) {
        setError("Could not find valid JSON in AI response.");
        return;
      }

      const possibleJson = cleanedText.slice(firstBrace, lastBrace + 1);

      // Cleanup common issues
      let safeJson = possibleJson
        .replace(/,\s*([}\]])/g, "$1") // remove trailing commas
        .replace(/[\u0000-\u001F]+/g, ""); // remove weird control chars

      let parsedJson = null;
      try {
        parsedJson = JSON.parse(safeJson);
        setInvoiceData(parsedJson);
      } catch (e) {
        console.error("JSON parsing failed:", e.message, safeJson);
        setError("Failed to parse AI output as JSON");
        return null;
      }

      return parsedJson;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, invoiceData, error, generateItemsForItemization };
}
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category } = await req.json();

    if (!query?.trim()) {
      throw new Error("Please provide a description of what you need.");
    }

    const systemPrompt = `You are an Excel formula expert specializing in HR and business analytics.
When given a natural language description, respond with ONLY a JSON object containing:
- "formula": the exact Excel formula (ready to paste)
- "explanation": a clear, concise explanation of how the formula works (2-3 sentences max)

Rules:
- Use standard Excel functions (VLOOKUP, SUMIF, COUNTIF, IF, INDEX/MATCH, etc.)
- Assume data starts at row 2 (row 1 is headers)
- Use common column letters (A, B, C, etc.)
- Make formulas practical and immediately usable
- Do NOT include any markdown formatting in your response, just the raw JSON object`;

    const userPrompt = `${category ? `Category: ${category}\n` : ""}Description: ${query}

Generate the Excel formula as a JSON object with "formula" and "explanation" fields.`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("API key not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        throw new Error("Rate limit reached. Please wait a moment and try again.");
      }
      if (response.status === 402) {
        throw new Error("Usage limit reached. Please check your Lovable AI credits.");
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the AI response
    let formula = "";
    let explanation = "";

    try {
      // Try to extract JSON from the response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        formula = parsed.formula || "";
        explanation = parsed.explanation || "";
      }
    } catch {
      // If JSON parsing fails, use the raw content
      formula = rawContent;
      explanation = "Generated formula based on your description.";
    }

    return new Response(JSON.stringify({ formula, explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Excel formula error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate formula" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

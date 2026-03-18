import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const templatePrompts: Record<string, string> = {
  "offer-letter":
    "Write a professional offer letter for a new hire. Include welcoming tone, position details, compensation, start date, and next steps.",
  "hr-policy":
    "Write a clear and comprehensive HR policy document. Include purpose, scope, policy statement, procedures, and compliance expectations.",
  "event-announcement":
    "Write an engaging event announcement for employees. Include event details, purpose, what to expect, and RSVP instructions.",
  "internal-email":
    "Write a professional internal email. Be clear, concise, and actionable. Include proper greeting and sign-off.",
  "job-description":
    "Write a compelling job description. Include role overview, key responsibilities, qualifications, and what makes this role exciting.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, tone, fields } = await req.json();

    const templateContext = templatePrompts[template] || "Write professional HR content.";

    const fieldDetails = Object.entries(fields || {})
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const systemPrompt = `You are an expert HR content writer. Generate polished, ready-to-use HR content.
Tone: ${tone || "Professional"}
Always write complete, detailed content that can be used immediately without edits.
Do not include any markdown formatting, just plain text with proper paragraphs.`;

    const userPrompt = `${templateContext}

Details provided:
${fieldDetails || "No specific details provided - use placeholder values like [Company Name], [Date], etc."}

Generate the complete content now.`;

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
        temperature: 0.7,
        max_tokens: 2000,
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
    const content = data.choices?.[0]?.message?.content || "No content generated.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Content writer error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate content" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

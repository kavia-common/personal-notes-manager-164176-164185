//
// PUBLIC_INTERFACE
export async function askPerplexity(prompt, { top_k = 5 } = {}) {
  /**
   * Calls Perplexity's web search/chat completion API with the provided prompt.
   * Reads the API key from environment variable REACT_APP_PERPLEXITY_API_KEY.
   *
   * Returns a normalized payload:
   * {
   *   text: string,               // main assistant reply
   *   citations: [                // optional web citations
   *     { title, url, snippet }
   *   ]
   * }
   *
   * Throws a descriptive Error on non-2xx or missing key.
   */
  const apiKey = process.env.REACT_APP_PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing Perplexity API key. Please set REACT_APP_PERPLEXITY_API_KEY in your environment."
    );
  }

  // Perplexity's chat completions endpoint with web search
  const url = "https://api.perplexity.ai/chat/completions";

  const body = {
    model: "sonar", // general web-enabled model
    messages: [
      { role: "system", content: "You are a helpful assistant that answers with concise, sourced results when appropriate." },
      { role: "user", content: prompt }
    ],
    // web search settings
    // According to Perplexity docs, enabling search is default for sonar; top_k controls citations depth.
    top_k
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const reason = text || res.statusText || "Unknown error";
    throw new Error(`Perplexity request failed (${res.status}): ${reason}`);
  }

  const data = await res.json();

  // Expected structure similar to OpenAI: choices[0].message.content
  const text = data?.choices?.[0]?.message?.content || "";
  // Perplexity often returns citations under 'citations' or 'sources' in the response.
  // Normalize best-effort.
  const rawCitations =
    data?.citations ||
    data?.choices?.[0]?.citations ||
    data?.sources ||
    data?.choices?.[0]?.sources ||
    [];

  const citations = (Array.isArray(rawCitations) ? rawCitations : []).map((c) => {
    if (typeof c === "string") return { title: c, url: c, snippet: "" };
    return {
      title: c?.title || c?.url || "Source",
      url: c?.url || "",
      snippet: c?.snippet || c?.description || ""
    };
  });

  return { text, citations };
}

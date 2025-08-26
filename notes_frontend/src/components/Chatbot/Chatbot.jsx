import React, { useMemo, useRef, useState, useEffect } from "react";
import "./Chatbot.css";
import { askPerplexity } from "./PerplexityService";

// Small inline icon set for the chatbot
function Icon({ name, size = 20 }) {
  const s = { width: size, height: size };
  switch (name) {
    case "chat":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <path d="M4 6a4 4 0 014-4h8a4 4 0 014 4v6a4 4 0 01-4 4H9l-5 4V6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "send":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "close":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    default:
      return null;
  }
}

// PUBLIC_INTERFACE
export default function Chatbot() {
  /**
   * Chatbot UI that lets users ask web-enabled questions via Perplexity.
   * - Floating action button to open/close panel
   * - Remembers conversation within session
   * - Shows loading, errors, and source citations
   * - Uses global CSS variables for consistent styling
   */
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can search the web and summarize results. Ask me anything like “What’s the latest on React 18 features?”",
      citations: []
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const bodyRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading, err, open]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const onSend = async () => {
    if (!canSend) return;
    const text = input.trim();
    setInput("");
    setErr("");

    const userMsg = { id: String(Date.now()), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await askPerplexity(text, { top_k: 5 });
      const assistantMsg = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: result.text || "I couldn't find an answer.",
        citations: result.citations || []
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setErr(
        e?.message ||
          "Something went wrong while contacting the search service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <>
      <button
        className="chat-fab"
        aria-label={open ? "Close chatbot" : "Open chatbot"}
        title={open ? "Close chatbot" : "Ask AI (web search)"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <Icon name="close" /> : <Icon name="chat" />}
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Web search chatbot">
          <div className="chat-header">
            <span>AI Assistant</span>
            <button
              className="icon-btn"
              style={{ border: "none", background: "transparent", color: "var(--text-normal)" }}
              onClick={() => setOpen(false)}
              aria-label="Close"
              title="Close"
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="chat-body" ref={bodyRef}>
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.role === "user" ? "msg-user" : "msg-assistant"}`}>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                {m.citations && m.citations.length > 0 && (
                  <div className="citations" aria-label="Sources">
                    {m.citations.map((c, idx) => (
                      <div key={idx} className="citation-item">
                        <div className="citation-title">{c.title}</div>
                        {c.url && (
                          <div className="citation-url">
                            <a href={c.url} target="_blank" rel="noreferrer">
                              {c.url}
                            </a>
                          </div>
                        )}
                        {c.snippet && <div className="citation-snippet">{c.snippet}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && <div className="chat-loader">Searching the web…</div>}
            {err && <div className="chat-error" role="alert">{err}</div>}
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask about anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Chat input"
            />
            <button className="chat-send-btn" onClick={onSend} disabled={!canSend} title="Send">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="send" /> Send
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

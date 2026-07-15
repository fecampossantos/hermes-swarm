import React, { useState, useRef, useEffect } from "react";

/**
 * Communication interface for sending messages to the Boss.
 * @param {Object} props
 * @param {boolean} props.hasBoss - True if boss is available
 * @param {Array} props.logs - List of log messages
 * @param {Function} props.onSendMessage - Callback to send a message
 */
export default function CommunicationLog({ hasBoss, logs, onSendMessage }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !hasBoss) return;

    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="log-container">
      <div
        className="section"
        style={{
          marginBottom: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2>Communication</h2>

        <div
          className="log-messages"
          ref={messagesEndRef}
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "16px",
            maxHeight: "200px",
          }}
        >
          {logs.length === 0 ? (
            <div
              className="msg"
              style={{ borderLeftColor: "transparent", color: "#94a3b8" }}
            >
              No messages yet.
            </div>
          ) : (
            logs.map((log, idx) => {
              const isAgent = log.sender !== "user" && log.sender !== "system";
              return (
              <div
                key={idx}
                className={`msg ${isAgent ? "boss" : ""}`}
              >
                <strong>
                  {log.sender === "user"
                    ? "You: "
                    : log.sender === "system"
                      ? "System: "
                      : `${log.sender}: `}
                </strong>
                {log.text === "" && isAgent ? (
                  <span style={{ fontStyle: "italic", color: "#94a3b8" }}>
                    thinking...
                  </span>
                ) : (
                  log.text
                )}
              </div>
            )})
          )}
        </div>

        <form onSubmit={handleSend} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasBoss ? "Ask boss..." : "Create a boss first"}
            disabled={!hasBoss}
            style={{
              flex: 1,
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid var(--border-glass)",
              borderRadius: "6px",
              color: "white",
              padding: "10px",
            }}
          />
          <button
            type="submit"
            className="btn"
            style={{ width: "auto" }}
            disabled={!hasBoss}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

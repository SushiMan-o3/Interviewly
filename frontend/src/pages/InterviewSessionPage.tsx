import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WS_URL, TOKEN_KEY } from "../api/client";

type ConnectionState = "connecting" | "open" | "closed";

interface ChatMessage {
  id: number;
  type: "ai" | "user" | "system";
  text: string;
}

let nextMessageId = 1;

export default function InterviewSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    const socket = new WebSocket(`${WS_URL}/interviews/interview_session/${id}?token=${encodeURIComponent(token)}`);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnection("open");
      setMessages((prev) => [...prev, { id: nextMessageId++, type: "system", text: "Connected to your interviewer." }]);
    };

    socket.onmessage = (event) => {
      let text = event.data;
      try {
        const parsed = JSON.parse(event.data);
        if (parsed && typeof parsed.message === "string") {
          text = parsed.message;
        }
      } catch {
        // plain text frame, use as-is
      }
      setMessages((prev) => [...prev, { id: nextMessageId++, type: "ai", text }]);
    };

    socket.onclose = () => {
      setConnection("closed");
    };

    socket.onerror = () => {
      setConnection("closed");
    };

    return () => {
      socket.close();
    };
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleCamera = async () => {
    if (cameraOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch {
      setMessages((prev) => [...prev, { id: nextMessageId++, type: "system", text: "Could not access your camera." }]);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(text);
    setMessages((prev) => [...prev, { id: nextMessageId++, type: "user", text }]);
    setInput("");
  };

  const handleEnd = () => {
    if (window.confirm("End this interview session?")) {
      socketRef.current?.close();
      navigate("/interviews");
    }
  };

  return (
    <div className="frame-nocturne">
      <div className="session-container">
        <div className="video-section">
          <div className="session-title">
            <span className="accent-dot"></span>
            Interview session
            <span className={`connection-badge ${connection}`} style={{ marginLeft: 10 }}>
              {connection}
            </span>
          </div>

          <div className="video-frame">
            <div className="video-placeholder">
              <span>Interviewer feed</span>
            </div>
            <div className="self-view">
              {!cameraOn && (
                <div className="self-view-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 7l-7 5 7 5V7z"></path>
                    <rect x="1" y="5" width="15" height="14" rx="2"></rect>
                  </svg>
                </div>
              )}
              <video ref={videoRef} autoPlay playsInline muted style={{ display: cameraOn ? "block" : "none" }} />
            </div>
          </div>

          <div className="controls-bar">
            <button
              className={`control-btn mute${muted ? " active" : ""}`}
              type="button"
              title="Mute/Unmute"
              onClick={() => setMuted((m) => !m)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>

            <button
              className={`control-btn camera${cameraOn ? " active" : ""}`}
              type="button"
              title="Toggle camera"
              onClick={toggleCamera}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z"></path>
                <rect x="1" y="5" width="15" height="14" rx="2"></rect>
              </svg>
            </button>

            <button
              className={`control-btn chat${chatOpen ? " active" : ""}`}
              type="button"
              title="Toggle chat"
              onClick={() => setChatOpen((c) => !c)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>

            <button className="control-btn end" type="button" title="End interview" onClick={handleEnd}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                <line x1="23" y1="1" x2="1" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        {chatOpen && (
          <div className="side-panel">
            <div className="panel-header">
              <h3>Chat</h3>
              <button type="button" title="Close chat" onClick={() => setChatOpen(false)}>✕</button>
            </div>

            <div className="chat-messages">
              {messages.map((msg) => (
                <div className={`message ${msg.type}`} key={msg.id}>{msg.text}</div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                disabled={connection !== "open"}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

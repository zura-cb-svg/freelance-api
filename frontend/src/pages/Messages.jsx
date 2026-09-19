import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { MessageSquare, Send, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/ui/EmptyState";

export function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const receiverId = location.state?.receiverId || null;

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // ვუკავშირდებით შენს Render-ის სერვერს (ან ლოკალურს ტესტირებისას)
    const wsUrl = import.meta.env.DEV
      ? `ws://127.0.0.1:8000/chat/ws/${user.id}`
      : `wss://freelance-api-g8gh.onrender.com/chat/ws/${user.id}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log("WebSocket Connected!");

    // როცა ახალი მესიჯი მოდის სერვერიდან
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [user]);

  // ავტომატურად ჩამოსქროლვა ახალ მესიჯზე
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !ws.current || !receiverId) return;

    const messageData = {
      content: inputValue,
      receiver_id: receiverId,
    };

    // ვაგზავნით სერვერზე
    ws.current.send(JSON.stringify(messageData));

    // ვამატებთ ჩვენს ეკრანზეც
    setMessages((prev) => [...prev, { sender_id: user.id, content: inputValue }]);
    setInputValue("");
  };

  if (!user) {
    return (
      <div className="container-page py-10 text-center">
        <p>Please log in to view messages.</p>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-10 h-[calc(100vh-80px)] flex flex-col">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Messages</h1>
        <p className="mt-1 text-sm text-ink-500">Real-time conversation</p>
      </div>

      <div className="card mt-6 flex-1 flex flex-col overflow-hidden">
        {!receiverId ? (
          <div className="m-auto p-10">
            <EmptyState
              icon={MessageSquare}
              title="No active conversation"
              description="Go to any Job listing and click 'Message Client' to start chatting!"
            />
            <div className="text-center mt-4">
              <Link to="/jobs" className="btn-primary px-4 py-2 text-sm inline-block">
                Browse Jobs
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ჩატის ჰედერი */}
            <div className="border-b border-line p-4 flex items-center gap-3 bg-canvas">
              <div className="h-10 w-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-ink-900">User #{receiverId}</h3>
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                </span>
              </div>
            </div>

            {/* მესიჯების ველი */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.length === 0 && (
                <div className="text-center text-ink-400 text-sm mt-10">
                  No messages yet. Say hello! 👋
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-[15px] ${
                        isMe
                          ? "bg-brand-600 text-white rounded-br-sm"
                          : "bg-white border border-line text-ink-900 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* მესიჯის შესაყვანი ველი */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-line flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-line rounded-full px-4 py-2.5 focus:outline-none focus:border-brand-500 text-[15px]"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="bg-brand-600 text-white h-11 w-11 rounded-full flex items-center justify-center hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
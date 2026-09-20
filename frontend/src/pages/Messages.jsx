import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, Send, User, Check, CheckCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  
  const [inbox, setInbox] = useState([]);
  const [activeChat, setActiveChat] = useState(location.state?.receiverId || null);
  const [messages, setMessages] = useState([]);
  const [receiverName, setReceiverName] = useState("Loading...");
  const [inputValue, setInputValue] = useState("");
  
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const baseUrl = import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://freelance-api-g8gh.onrender.com";
  const wsBaseUrl = import.meta.env.DEV ? "ws://127.0.0.1:8000" : "wss://freelance-api-g8gh.onrender.com";

  // Load Inbox
  useEffect(() => {
    if (!user) return;
    fetch(`${baseUrl}/chat/inbox/${user.id}`)
      .then(res => res.json())
      .then(data => setInbox(data))
      .catch(err => console.error("Inbox error", err));
  }, [user, messages]);

  // Handle Active Chat & WebSocket
  useEffect(() => {
    if (!user || !activeChat) return;

    fetch(`${baseUrl}/chat/history/${user.id}/${activeChat}`)
      .then(res => res.json())
      .then(data => {
        setReceiverName(data.other_name);
        setMessages(data.messages);
      });

    ws.current = new WebSocket(`${wsBaseUrl}/chat/ws/${user.id}`);
    
    ws.current.onopen = () => {
      // Send read receipt for all past messages when opening chat
      ws.current.send(JSON.stringify({ type: "read", receiver_id: activeChat }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "message") {
        setMessages(prev => [...prev, data]);
        // Auto-send read receipt if chat is open
        if (data.sender_id === activeChat) {
          ws.current.send(JSON.stringify({ type: "read", receiver_id: activeChat }));
        }
      } else if (data.type === "typing" && data.sender_id === activeChat) {
        setIsTyping(data.is_typing);
      } else if (data.type === "read" && data.reader_id === activeChat) {
        setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      } else if (data.type === "status" && data.user_id === activeChat) {
        setIsOnline(data.is_online);
      }
    };

    return () => ws.current?.close();
  }, [user, activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleTyping = (e) => {
    setInputValue(e.target.value);
    if (!ws.current || !activeChat) return;
    
    ws.current.send(JSON.stringify({ type: "typing", receiver_id: activeChat, is_typing: true }));
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      ws.current.send(JSON.stringify({ type: "typing", receiver_id: activeChat, is_typing: false }));
    }, 1500);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !ws.current || !activeChat) return;

    ws.current.send(JSON.stringify({ type: "message", content: inputValue, receiver_id: activeChat }));
    setMessages(prev => [...prev, { sender_id: user.id, content: inputValue, is_read: false }]);
    ws.current.send(JSON.stringify({ type: "typing", receiver_id: activeChat, is_typing: false }));
    setInputValue("");
  };

  if (!user) return <div className="container-page py-10 text-center">Please log in to view messages.</div>;

  return (
    <div className="container-page max-w-5xl py-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="card flex-1 flex overflow-hidden border border-line">
        
        {/* INBOX */}
        <div className="w-1/3 sm:w-80 border-r border-line bg-surface overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-line font-semibold text-ink-900 shrink-0">Conversations</div>
          {inbox.map((contact) => (
            <button
              key={contact.user_id}
              onClick={() => setActiveChat(contact.user_id)}
              className={`w-full text-left p-4 border-b border-line flex items-center gap-3 hover:bg-canvas transition ${
                activeChat === contact.user_id ? "bg-brand-50" : ""
              }`}
            >
              <div className="h-10 w-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center shrink-0">
                <User size={18} />
              </div>
              <div className="overflow-hidden w-full">
                <div className="font-medium text-ink-900 truncate">{contact.name}</div>
                <div className="text-xs text-ink-500 truncate mt-0.5">{contact.last_message}</div>
              </div>
            </button>
          ))}
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col bg-canvas relative">
          {!activeChat ? (
            <div className="m-auto text-center text-ink-500 flex flex-col items-center">
              <MessageSquare size={48} className="mb-4 text-line" />
              <p>Select a conversation from the left menu</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-line p-4 flex items-center gap-3 bg-white shrink-0">
                <h3 className="font-semibold text-ink-900">{receiverName}</h3>
                <span className={`text-xs font-medium flex items-center gap-1 ${isOnline ? "text-green-600" : "text-gray-400"}`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`}></span> 
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`rounded-2xl px-4 py-2.5 text-[15px] ${
                          isMe ? "bg-brand-600 text-white rounded-br-sm" : "bg-white border border-line text-ink-900 rounded-bl-sm"
                        }`}>
                          {msg.content}
                        </div>
                        {isMe && (
                          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 pr-1">
                            {msg.is_read ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} />}
                            {msg.is_read ? "Seen" : "Sent"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-line text-ink-500 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm italic">
                      Typing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 bg-white border-t border-line flex gap-3 shrink-0">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 border border-line rounded-full px-4 py-2.5 focus:outline-none focus:border-brand-500 text-[15px]"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="bg-brand-600 text-white h-11 w-11 rounded-full flex items-center justify-center hover:bg-brand-700 transition disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
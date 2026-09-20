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
  const [receiverName, setReceiverName] = useState("Select a conversation");
  const [inputValue, setInputValue] = useState("");
  
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  
  const baseUrl = "http://localhost:8001";
  const wsBaseUrl = "ws://localhost:8001";

  // Inbox ჩატვირთვა
  useEffect(() => {
    if (!user) return;
    fetch(`${baseUrl}/chat/inbox/${user.id}`)
      .then(res => res.json())
      .then(data => setInbox(data))
      .catch(err => console.error("Inbox error", err));
  }, [user, messages]);

  // ჩატის გახსნა და WebSocket დაკავშირება
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
      ws.current.send(JSON.stringify({ type: "read", receiver_id: activeChat }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        setMessages(prev => [...prev, data]);
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

  // ავტო-სქროლი ქვემოთ
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

  if (!user) return <div className="p-10 text-center">Please log in to view messages.</div>;

  return (
    <div className="max-w-5xl mx-auto py-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex-1 flex overflow-hidden border rounded-lg bg-white shadow-sm">
        
        {/* მარცხენა სვეტი - INBOX */}
        <div className="w-1/3 border-r bg-gray-50 overflow-y-auto flex flex-col">
          <div className="p-4 border-b font-semibold bg-white">Messages</div>
          {inbox.map((contact) => (
            <button
              key={contact.user_id}
              onClick={() => setActiveChat(contact.user_id)}
              className={`w-full text-left p-4 border-b flex items-center gap-3 hover:bg-gray-100 ${
                activeChat === contact.user_id ? "bg-blue-50" : ""
              }`}
            >
              <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0">
                <User size={18} />
              </div>
              <div className="overflow-hidden w-full">
                <div className="font-medium truncate">{contact.name}</div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{contact.last_message}</div>
              </div>
            </button>
          ))}
        </div>

        {/* მარჯვენა სვეტი - CHAT */}
        <div className="flex-1 flex flex-col bg-gray-50 relative">
          {!activeChat ? (
            <div className="m-auto text-center text-gray-400">
              <MessageSquare size={48} className="mb-4 mx-auto opacity-50" />
              <p>Select a user to start chatting</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b p-4 flex items-center gap-3 bg-white">
                <h3 className="font-semibold">{receiverName}</h3>
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
                        <div className={`rounded-2xl px-4 py-2 text-sm ${
                          isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border rounded-bl-sm"
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
                  <div className="text-gray-400 text-xs italic px-2">Typing...</div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="bg-blue-600 text-white h-10 w-10 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
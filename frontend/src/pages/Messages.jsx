import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, Send, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  
  // States
  const [inbox, setInbox] = useState([]);
  const [activeChat, setActiveChat] = useState(location.state?.receiverId || null);
  const [messages, setMessages] = useState([]);
  const [receiverName, setReceiverName] = useState("Loading...");
  const [inputValue, setInputValue] = useState("");
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const baseUrl = import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://freelance-api-g8gh.onrender.com";
  const wsBaseUrl = import.meta.env.DEV ? "ws://127.0.0.1:8000" : "wss://freelance-api-g8gh.onrender.com";

  // 1. მარცხენა სვეტის (Inbox-ის) ჩატვირთვა
  useEffect(() => {
    if (!user) return;
    fetch(`${baseUrl}/chat/inbox/${user.id}`)
      .then(res => res.json())
      .then(data => setInbox(data))
      .catch(err => console.error("Inbox error", err));
  }, [user, messages]); // messages როცა ემატება, მარცხენა სვეტიც განახლდება (ბოლო მესიჯი)

  // 2. როცა მარცხნივ ვინმეს დავაკლიკებთ, ჩაიტვირთოს მისი მიმოწერა და გაიხსნას WebSocket
  useEffect(() => {
    if (!user || !activeChat) return;

    // ისტორიის წამოღება
    fetch(`${baseUrl}/chat/history/${user.id}/${activeChat}`)
      .then(res => res.json())
      .then(data => {
        setReceiverName(data.other_name);
        setMessages(data.messages);
      });

    // ლაივ კავშირის დამყარება
    ws.current = new WebSocket(`${wsBaseUrl}/chat/ws/${user.id}`);
    ws.current.onmessage = (event) => {
      setMessages(prev => [...prev, JSON.parse(event.data)]);
    };

    return () => ws.current?.close();
  }, [user, activeChat]);

  // ავტომატური სქროლი
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !ws.current || !activeChat) return;

    ws.current.send(JSON.stringify({ content: inputValue, receiver_id: activeChat }));
    setMessages(prev => [...prev, { sender_id: user.id, content: inputValue }]);
    setInputValue("");
  };

  if (!user) return <div className="container-page py-10 text-center">Please log in to view messages.</div>;

  return (
    <div className="container-page max-w-5xl py-6 h-[calc(100vh-80px)] flex flex-col">
      <h1 className="text-2xl font-semibold text-ink-900 mb-4">Messages</h1>
      
      <div className="card flex-1 flex overflow-hidden border border-line">
        {/* --- მარცხენა სვეტი: INBOX --- */}
        <div className="w-1/3 sm:w-80 border-r border-line bg-surface overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-line font-semibold text-ink-900 shrink-0">Conversations</div>
          
          {inbox.length === 0 ? (
            <div className="p-4 text-sm text-ink-500 text-center">No active chats yet.</div>
          ) : (
            inbox.map((contact) => (
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
                <div className="overflow-hidden">
                  <div className="font-medium text-ink-900 truncate">{contact.name}</div>
                  <div className="text-xs text-ink-500 truncate mt-0.5">{contact.last_message}</div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* --- მარჯვენა სვეტი: CHAT --- */}
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
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                </span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-[15px] ${
                        isMe ? "bg-brand-600 text-white rounded-br-sm" : "bg-white border border-line text-ink-900 rounded-bl-sm"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={sendMessage} className="p-4 bg-white border-t border-line flex gap-3 shrink-0">
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
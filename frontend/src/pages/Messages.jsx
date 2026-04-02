import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useSocket } from '../context/SocketContext';

const Messages = () => {
  const { user } = useUser();
  const { socket, onlineUsers, clearNotifications, notifications } = useSocket();
  const location = useLocation(); 

  // Data States
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Input States
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  // UI States
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Ref for auto-scrolling to the bottom of the chat
  const messagesEndRef = useRef(null);

  // Catch the passed user from the Alumni Directory
  useEffect(() => {
    if (location.state?.preselectedUser) {
      setSelectedChat(location.state.preselectedUser);
      
      // Clear the state so refreshing the page doesn't re-trigger it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 1. Fetch the list of conversations (Sidebar)
  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/messages/conversations', { withCredentials: true });
      setConversations(response.data.data || []);
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // 2. Fetch specific chat history when a conversation is clicked
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      
      // Clear notifications locally in React
      if (clearNotifications) {
        clearNotifications(selectedChat._id); 
      }
      
      setIsLoadingMessages(true);
      try {
        // 🔥 FIX: TELL THE DATABASE YOU READ THE MESSAGES!
        await axios.put('/api/messages/mark-read', { senderId: selectedChat._id }, { withCredentials: true });

        // Now fetch the messages as usual
        const response = await axios.get(`/api/messages/${selectedChat._id}`, { withCredentials: true });
        setMessages(response.data.data || []);
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    fetchMessages();
    
    // NOTE: clearNotifications is intentionally left out of this dependency array to prevent infinite loops!
  }, [selectedChat]); 

  // 3. ⚡ REAL-TIME SOCKET LISTENER ⚡
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (incomingMessage) => {
      // If the incoming message belongs to the chat we are currently looking at, add it to the screen
      if (
        selectedChat && 
        (incomingMessage.sender === selectedChat._id || incomingMessage.receiver === selectedChat._id)
      ) {
        setMessages((prev) => [...prev, incomingMessage]);
      }
      
      // Re-fetch conversations to update the "latest message" preview in the sidebar
      fetchConversations();
    };

    socket.on("newMessage", handleNewMessage);

    // Cleanup listener on unmount
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, selectedChat]);

  // 4. Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 5. Send a Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !selectedChat) return;

    setIsSending(true);
    try {
      // Use FormData to support file uploads
      const formData = new FormData();
      if (newMessage.trim()) formData.append('content', newMessage);
      if (attachment) formData.append('attachment', attachment);

      const response = await axios.post(`/api/messages/send/${selectedChat._id}`, formData, { 
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      // Instantly add our own message to the screen
      setMessages((prev) => [...prev, response.data.data]);
      
      // Reset inputs
      setNewMessage('');
      setAttachment(null);
      
      // Update sidebar preview
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Helper to format timestamps
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans h-[calc(100vh-80px)]">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex h-full overflow-hidden">
        
        {/* ========================================== */}
        {/* LEFT SIDEBAR: CONVERSATION LIST            */}
        {/* ========================================== */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoadingChats ? (
              <div className="flex justify-center py-10"><svg className="animate-spin h-6 w-6 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-500 text-sm">No active conversations. Reach out to someone from the directory!</div>
            ) : (
              conversations.map((conv) => {
                // Find the *other* participant in the conversation
                const otherUser = conv.participants.find(p => p._id !== user._id);
                if (!otherUser) return null;

                const isOnline = onlineUsers.includes(otherUser._id);
                const isSelected = selectedChat?._id === otherUser._id;

                // Calculate unread messages specifically for THIS person
                const unreadCount = notifications?.filter(msg => msg.sender === otherUser._id).length || 0;

                return (
                  <button 
                    key={conv._id}
                    onClick={() => setSelectedChat(otherUser)}
                    className={`w-full text-left p-4 flex items-center gap-3 border-b border-slate-100 transition-colors ${isSelected ? 'bg-orange-50/50' : 'hover:bg-white bg-transparent'}`}
                  >
                    {/* Avatar with Online Badge */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 uppercase overflow-hidden">
                        {otherUser.avatar ? <img src={otherUser.avatar} className="w-full h-full object-cover" alt="" /> : otherUser.name.charAt(0)}
                      </div>
                      {isOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className={`text-sm truncate ${unreadCount > 0 ? 'font-extrabold text-slate-900' : 'font-bold text-slate-700'}`}>
                          {otherUser.name}
                        </p>
                        
                        {/* Render the specific unread badge for this chat */}
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      
                      {/* Make the preview text bold if there are unread messages */}
                      <p className={`text-xs truncate ${unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                        {conv.lastMessage?.text || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT SIDEBAR: ACTIVE CHAT WINDOW          */}
        {/* ========================================== */}
        <div className={`flex-1 flex flex-col bg-white ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Your Messages</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-sm">Select a conversation from the sidebar or start a new one from the Alumni Directory.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-white shrink-0">
                <button onClick={() => setSelectedChat(null)} className="md:hidden text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 uppercase overflow-hidden shrink-0">
                  {selectedChat.avatar ? <img src={selectedChat.avatar} className="w-full h-full object-cover" alt="" /> : selectedChat.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-none">{selectedChat.name}</h3>
                  <span className="text-xs font-medium text-slate-500">
                    {onlineUsers.includes(selectedChat._id) ? <span className="text-green-600">Active now</span> : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Chat Bubbles Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 custom-scrollbar space-y-4">
                {isLoadingMessages ? (
                   <div className="flex justify-center py-10"><svg className="animate-spin h-6 w-6 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
                ) : (
                  messages.map((msg, index) => {
                    const isMine = msg.sender === user._id;
                    return (
                      <div key={index} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                          isMine 
                            ? 'bg-orange-500 text-white rounded-br-sm shadow-sm' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'
                        }`}>
                          {/* If there's an attachment, render it */}
                          {msg.attachments && (
                            <div className="mb-2">
                              {msg.attachments.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                <img src={msg.attachments} alt="attachment" className="rounded-lg max-h-48 object-cover" />
                              ) : (
                                <a href={msg.attachments} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline text-sm font-bold opacity-90 hover:opacity-100">
                                  📎 View Attachment
                                </a>
                              )}
                            </div>
                          )}
                          {/* The text content */}
                          {msg.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 mt-1 mx-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
                {/* Invisible div to scroll to */}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Area */}
              <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                {attachment && (
                  <div className="mb-3 px-3 py-2 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg border border-orange-100 flex items-center justify-between">
                    <span className="truncate">📎 {attachment.name}</span>
                    <button onClick={() => setAttachment(null)} className="hover:text-red-600 ml-2">✕</button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  
                  {/* Custom File Upload Button */}
                  <label className="shrink-0 p-2.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors border border-transparent">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    <input type="file" className="hidden" onChange={(e) => setAttachment(e.target.files[0])} />
                  </label>

                  <div className="flex-1 relative">
                    <textarea 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white resize-none custom-scrollbar min-h-[44px] max-h-32"
                      rows="1"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSending || (!newMessage.trim() && !attachment)}
                    className="shrink-0 p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSending ? (
                       <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    )}
                  </button>

                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Messages;
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useSocket } from '../context/SocketContext';

const CampusChat = () => {
    const { user } = useUser();
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get('/api/messages/college/history', { withCredentials: true });
                setMessages(res.data.data);
            } catch (err) {
                console.error("History fetch failed", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on("receiveCollegeMessage", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });
        return () => socket.off("receiveCollegeMessage");
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !attachment) return;

        setIsSending(true);
        try {
            const formData = new FormData();
            if (newMessage) formData.append('content', newMessage);
            if (attachment) formData.append('attachment', attachment);

            const res = await axios.post('/api/messages/college/send', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            socket.emit("sendCollegeMessage", {
                collegeId: user.activeMembership.college._id || user.activeMembership.college,
                message: res.data.data
            });

            setNewMessage('');
            setAttachment(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col bg-slate-50 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden mb-4">

            {/* --- HEADER --- */}
            <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>
                    <div>
                        <h2 className="font-black text-slate-900 text-lg tracking-tight flex items-center gap-2">
                            Campus Feed
                            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {user?.activeMembership?.college?.name || "Your Institution"}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- MESSAGE AREA --- */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <div className="w-20 h-20 bg-slate-200 rounded-full mb-4 flex items-center justify-center">
                            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        </div>
                        <p className="font-bold text-slate-500 italic">No announcements yet. Break the ice!</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        // Use optional chaining and default to 'student' if role is missing
                        const isMine = msg.sender._id === user._id;
                        const userRole = msg.sender?.activeMembership?.role || 'student';
                        const isAlumni = userRole === 'alumni';

                        return (
                            <div key={i} className={`flex gap-4 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className="shrink-0 mt-1">
                                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 p-0.5 shadow-sm overflow-hidden">
                                        <img
                                            src={msg.sender.avatar || `https://ui-avatars.com/api/?name=${msg.sender.name}`}
                                            className="w-full h-full object-cover rounded-xl"
                                            alt=""
                                        />
                                    </div>
                                </div>

                                {/* Bubble Container */}
                                <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                    {/* Name and Role */}
                                    <div className="flex items-center gap-2 mb-1.5 px-1">
                                        <span className="text-xs font-black text-slate-700">{msg.sender.name}</span>
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${isAlumni ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                            }`}>
                                            {isAlumni ? 'Alumni' : 'Student'}
                                        </span>
                                    </div>

                                    {/* Bubble */}
                                    <div className={`p-4 rounded-3xl shadow-sm border ${isMine
                                            ? 'bg-orange-500 text-white border-orange-400 rounded-tr-none'
                                            : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                                        }`}>
                                        {msg.attachments && (
                                            <div className="mb-3 overflow-hidden rounded-xl bg-black/5">
                                                {msg.attachments.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                    <img src={msg.attachments} className="max-h-64 w-full object-contain cursor-pointer" alt="Attachment" />
                                                ) : (
                                                    <a href={msg.attachments} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 text-xs font-bold underline">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                        Download Document
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                                    </div>

                                    {/* Timestamp */}
                                    <span className="text-[10px] font-bold text-slate-400 mt-1.5 px-1 uppercase tracking-widest">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* --- INPUT AREA --- */}
            <div className="p-6 bg-white border-t border-slate-100">
                {attachment && (
                    <div className="mb-4 p-3 bg-orange-50 text-orange-600 text-xs font-bold rounded-2xl flex justify-between items-center border border-orange-100 animate-in slide-in-from-bottom-2">
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                            {attachment.name}
                        </span>
                        <button onClick={() => setAttachment(null)} className="hover:bg-orange-100 p-1 rounded-full transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-end gap-4">
                    <div className="flex-1 relative flex items-center">
                        {/* File Clip Button */}
                        <label className="absolute left-2 p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl cursor-pointer transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            <input type="file" className="hidden" onChange={(e) => setAttachment(e.target.files[0])} />
                        </label>

                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            rows="1"
                            placeholder="What's happening on campus?"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm font-medium resize-none custom-scrollbar"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSending || (!newMessage.trim() && !attachment)}
                        className="h-14 px-8 bg-orange-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-orange-200 active:scale-95"
                    >
                        {isSending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : 'Post'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CampusChat;
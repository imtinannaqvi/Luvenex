"use client";

import { useState, useEffect, useRef } from "react";
import { getToken, getUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";
import { useNotifications } from "@/context/Notificationscontext";
import Link from "next/link";
import { useSearchParams,useRouter } from "next/navigation";
import {
  FiSearch,
  FiHome,
  FiPaperclip,
  FiFileText,
  FiX,
  FiInfo,
  FiInbox,
  FiChevronLeft,
} from "react-icons/fi";

const ATTACHMENT_DEFAULT_LABELS = ["📷 Photo", "🎥 Video", "📄 Document"];

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [conversationSearch, setConversationSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);

  const [inboxTab, setInboxTab] = useState<"messages" | "requests">("messages");

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);

  const user = getUser();
  const router = useRouter()

  const { reload } = useNotifications();
  const searchParams = useSearchParams();

 const loadConversations = async () => {
  setLoading(true);
  try {
    const data = await apiFetch("/api/conversations", {
      token: getToken()!,
    });
    const convs = data.conversations || [];
    setConversations(convs);

    // ✅ if we arrived here with a specific conversation to open, select it
    const conversationIdFromUrl = searchParams.get("conversationId");
    if (conversationIdFromUrl) {
      setActiveId(conversationIdFromUrl);
    }
  } catch (err: any) {
    toast.error(err.message || "Failed to load conversations");
  } finally {
    setLoading(false);
  }
};

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await apiFetch(
        `/api/conversations/${conversationId}/messages`,
        { token: getToken()! }
      );
      setMessages(data.messages || []);
      // Opening the thread marked it read on the server — refresh the badge.
      reload();
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    useEffect(() => {
    const socket = connectSocket();
    socket.on("new_messages", (msg: any) => {
      console.log("SOCKET MSG RECEIVED:", msg);   
      if (msg.conversationId === activeIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c._id === msg.conversationId
            ? {
                ...c,
                lastMessagePreview: msg.body || c.lastMessagePreview,
                lastMessageAt: msg.createdAt,
              }
            : c
        );
        return updated.sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0).getTime() -
            new Date(a.lastMessageAt || 0).getTime()
        );
      });
    });

    return () => {
  socket.off("new_messages");  
};
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    activeIdRef.current = activeId;
    if (activeId) {
      loadMessages(activeId);
      const socket = getSocket();
      socket.emit("join_conversation", activeId);
    }
    setShowMessageSearch(false);
    setMessageSearch("");
    clearPendingFile();
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  const otherParticipant = (conv: any) =>
    conv.participants?.find((p: any) => p._id !== user?.id);

  const activeConv = conversations.find((c) => c._id === activeId);
  const activeOtherUser = activeConv ? otherParticipant(activeConv) : null;

 
  const isPendingRequest = (conv: any) =>
    conv.isRequest === true || conv.status === "pending";

  const messagesTabConvs = conversations.filter((c) => !isPendingRequest(c));
  const requestsTabConvs = conversations.filter((c) => isPendingRequest(c));

  const visibleConversations =
    inboxTab === "messages" ? messagesTabConvs : requestsTabConvs;

  const filteredConversations = visibleConversations.filter((conv) => {
    const other = otherParticipant(conv);
    const name = (other?.name || other?.handle || "").toLowerCase();
    return name.includes(conversationSearch.toLowerCase());
  });

  const filteredMessages = messageSearch.trim()
    ? messages.filter((m) =>
        (m.body || "").toLowerCase().includes(messageSearch.toLowerCase())
      )
    : messages;

  const clearPendingFile = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);

    setPendingFile(file);
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setPendingPreviewUrl(URL.createObjectURL(file));
    } else {
      setPendingPreviewUrl(null);
    }
  };

  const sendTextMessage = () => {
    if (!messageBody.trim() || !activeId) return;
    setSending(true);
    const socket = getSocket();

    socket.emit(
      "send_message",
      { conversationId: activeId, body: messageBody },
      (response: any) => {
        setSending(false);
        if (response?.success) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === response.message._id)) return prev;
            return [...prev, response.message];
          });
          setMessageBody("");
          setConversations((prev) =>
            prev.map((c) =>
              c._id === activeId
                ? { ...c, isRequest: false, status: "accepted" }
                : c
            )
          );
        } else if (response?.error) {
          toast.error(response.error);
        }
      }
    );
  };

  const sendPendingAttachment = async () => {
    if (!pendingFile || !activeId) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("file", pendingFile);
      if (messageBody.trim()) formData.append("caption", messageBody.trim());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${activeId}/attachments`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Upload failed");

      setMessages((prev) => {
        if (prev.some((m) => m._id === data.message._id)) return prev;
        return [...prev, data.message];
      });
      setMessageBody("");
      clearPendingFile();

      setConversations((prev) => {
        const preview =
          data.message.attachmentType === "image"
            ? "📷 Photo"
            : data.message.attachmentType === "video"
            ? "🎥 Video"
            : "📄 Document";
        const updated = prev.map((c) =>
          c._id === activeId
            ? {
                ...c,
                lastMessagePreview: preview,
                lastMessageAt: data.message.createdAt,
                isRequest: false,
                status: "accepted",
              }
            : c
        );
        return updated.sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0).getTime() -
            new Date(a.lastMessageAt || 0).getTime()
        );
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload attachment");
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    if (!messageBody.trim() && !pendingFile) return;

    if (pendingFile) {
      await sendPendingAttachment();
    } else {
      sendTextMessage();
    }
  };

  const handleBookGig = async (gigId: string) => {
  try {
    const data = await apiFetch(`/api/gigs/${gigId}/order`, {
      method: "POST",
      token: getToken()!,
    });
    router.push(`/app/deals/${data.deal._id}`);
  } catch (err: any) {
    toast.error(err.message || "Failed to book gig");
  }
};

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-black h-[calc(100vh-4rem)] w-full text-zinc-100 flex">
      <div className="w-full h-full bg-black overflow-hidden flex flex-col md:flex-row relative">
        {/* Sidebar: Conversations List */}
        <div
          className={`w-full md:w-[360px] lg:w-[400px] border-r border-zinc-800/60 flex flex-col bg-black z-10 ${
            activeId ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Sidebar Header */}
          <div className="px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {user?.avatarUrl ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatarUrl}`}
                  alt="Me"
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <h1 className="text-lg font-bold text-white tracking-tight">
                {inboxTab === "requests"
                  ? "Requests"
                  : user?.name || user?.handle || "Messages"}
              </h1>
            </div>

            <Link
              href="/dashboard"
              className="p-2 rounded-full text-zinc-300 hover:bg-zinc-900 transition"
              title="Home"
            >
              <FiHome size={18} />
            </Link>
          </div>

          {/* Conversation Search */}
          <div className="px-4 sm:px-6 pb-3">
            <div className="relative">
              <FiSearch
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                placeholder="Search"
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border-none text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition"
              />
            </div>
          </div>

          {/* Conversations Items */}
          <div className="flex-1 overflow-y-auto p-2 border-t border-zinc-800/60">
            {filteredConversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-600">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium">
                  {conversationSearch
                    ? "No matching conversations"
                    : inboxTab === "requests"
                    ? "No message requests"
                    : "No conversations found"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = otherParticipant(conv);
                const isActive = activeId === conv._id;

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveId(conv._id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition duration-150 flex items-center gap-3 group relative ${
                      isActive ? "bg-zinc-900" : "hover:bg-zinc-900/60"
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      {other?.avatarUrl ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${other.avatarUrl}`}
                          alt={other.name}
                          className="w-12 h-12 rounded-full object-cover bg-zinc-900"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-base">
                          {other?.name?.[0]?.toUpperCase() ||
                            other?.handle?.[0]?.toUpperCase() ||
                            "?"}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
                    </div>

                    {/* Content Preview */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          isActive
                            ? "text-white font-semibold"
                            : "text-zinc-200 font-medium"
                        }`}
                      >
                        {other?.name || other?.handle || "Unknown User"}
                      </p>
                      <p className="text-sm text-zinc-500 truncate">
                        {conv.lastMessagePreview || "No messages yet"}
                        {conv.lastMessageAt && (
                          <span> · {formatTime(conv.lastMessageAt)}</span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Requests toggle — pinned at the bottom of the sidebar */}
          <div className="border-t border-zinc-800/60 p-2 shrink-0">
            {inboxTab === "messages" ? (
              <button
                onClick={() => {
                  setInboxTab("requests");
                  setConversationSearch("");
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-200 hover:bg-zinc-900/60 transition"
              >
                <span className="flex items-center gap-2.5 text-sm font-semibold">
                  <FiInbox size={17} className="text-zinc-400" />
                  Requests
                </span>
                {requestsTabConvs.length > 0 && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {requestsTabConvs.length > 9 ? "9+" : requestsTabConvs.length}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  setInboxTab("messages");
                  setConversationSearch("");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-zinc-200 hover:bg-zinc-900/60 transition text-sm font-semibold"
              >
                <FiChevronLeft size={18} className="text-zinc-400" />
                Back to Messages
              </button>
            )}
          </div>
        </div>

        {/* Main Chat Pane */}
        <div
          className={`flex-1 flex flex-col bg-black z-10 ${
            !activeId ? "hidden md:flex" : "flex"
          }`}
        >
          {!activeId ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full border-2 border-zinc-700 flex items-center justify-center text-zinc-300">
                <svg
                  className="w-9 h-9"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-base font-bold text-white">Your Messages</h3>
                <p className="text-sm text-zinc-500">
                  Select a chat from the list to view messages or start a new
                  conversation.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3 border-b border-zinc-800/60 bg-black flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setActiveId(null)}
                    className="md:hidden p-2 rounded-full text-zinc-300 hover:bg-zinc-900 transition"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Active User Avatar & Info */}
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      {activeOtherUser?.avatarUrl ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${activeOtherUser.avatarUrl}`}
                          alt={activeOtherUser.name}
                          className="w-9 h-9 rounded-full object-cover bg-zinc-900"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-xs">
                          {activeOtherUser?.name?.[0]?.toUpperCase() ||
                            activeOtherUser?.handle?.[0]?.toUpperCase() ||
                            "?"}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full" />
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-white leading-tight">
                        {activeOtherUser?.name ||
                          activeOtherUser?.handle ||
                          "User"}
                      </h2>
                      <p className="text-xs text-zinc-500 font-medium leading-tight">
                        {activeOtherUser?.handle
                          ? `${activeOtherUser.handle} · Active now`
                          : "Active now"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowMessageSearch((s) => !s)}
                    className={`p-2 rounded-full transition ${
                      showMessageSearch
                        ? "text-white bg-zinc-900"
                        : "text-zinc-300 hover:bg-zinc-900"
                    }`}
                    title="Search in conversation"
                  >
                    <FiSearch size={18} />
                  </button>
                  {activeOtherUser?.handle && (
                    <Link
                      href={`/creators/${activeOtherUser.handle}`}
                      className="p-2 rounded-full text-zinc-300 hover:bg-zinc-900 transition"
                      title="View Profile"
                    >
                      <FiInfo size={18} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Message Search Bar */}
              {showMessageSearch && (
                <div className="px-5 py-2.5 border-b border-zinc-800/60 bg-black shrink-0">
                  <div className="relative">
                    <FiSearch
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search in this conversation..."
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border-none text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition"
                    />
                  </div>
                </div>
              )}
{/* Requests banner */}
{isPendingRequest(activeConv) && (
  <div className="px-5 py-3 border-b border-zinc-800/60 bg-zinc-950 shrink-0 flex items-center justify-between gap-3">
    <p className="text-xs text-zinc-400">
      <span className="font-semibold text-white">
        {activeOtherUser?.name || activeOtherUser?.handle}
      </span>{" "}
      sent you a message request. Reply to accept the conversation.
    </p>
  </div>
)}

{activeConv?.relatedGigId && (
  <div className="px-5 py-3 border-b border-zinc-800/60 bg-zinc-950 shrink-0 flex items-center justify-between gap-3">
    <p className="text-xs text-zinc-400">Ready to move forward with this gig?</p>
    <button
      onClick={() => handleBookGig(activeConv.relatedGigId)}
      className="px-3 py-1.5 rounded-lg bg-[#B90808] text-white text-xs font-bold hover:bg-[#a10707] transition shrink-0"
    >
      Book This Gig
    </button>
  </div>
)}

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {filteredMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <div className="relative">
                      {activeOtherUser?.avatarUrl ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${activeOtherUser.avatarUrl}`}
                          alt={activeOtherUser.name}
                          className="w-20 h-20 rounded-full object-cover bg-zinc-900"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-2xl">
                          {activeOtherUser?.name?.[0]?.toUpperCase() ||
                            activeOtherUser?.handle?.[0]?.toUpperCase() ||
                            "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">
                        {activeOtherUser?.name || activeOtherUser?.handle}
                      </p>
                      {activeOtherUser?.handle && (
                        <p className="text-sm text-zinc-500">
                          {activeOtherUser.handle}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600">
                      {messageSearch
                        ? "No messages match your search."
                        : "Send a friendly greeting to start chatting!"}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((m) => {
                    const senderId = m.senderId?._id || m.senderId;
                    const isMine = senderId === user?.id;
                    const isMedia =
                      m.attachmentUrl &&
                      (m.attachmentType === "image" ||
                        m.attachmentType === "video");
                    const showBody =
                      m.body && !ATTACHMENT_DEFAULT_LABELS.includes(m.body);

                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col gap-1 py-0.5 ${
                          isMine ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Media renders bare — no colored bubble */}
                        {isMedia && (
                          <div className="max-w-[75%] sm:max-w-[60%] overflow-hidden rounded-2xl">
                            {m.attachmentType === "image" && (
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}${m.attachmentUrl}`}
                                alt="attachment"
                                className="max-w-[240px] rounded-2xl"
                              />
                            )}
                            {m.attachmentType === "video" && (
                              <video
                                src={`${process.env.NEXT_PUBLIC_API_URL}${m.attachmentUrl}`}
                                controls
                                className="max-w-[240px] rounded-2xl"
                              />
                            )}
                          </div>
                        )}

                        {/* Text and/or PDF keep the bubble */}
                        {(showBody || m.attachmentType === "pdf") && (
                          <div
                            className={`max-w-[75%] sm:max-w-[60%] px-4 py-2 text-sm font-normal leading-relaxed ${
                              isMine
                                ? "bg-primary text-white rounded-[20px] rounded-br-md"
                                : "bg-zinc-800 text-zinc-100 rounded-[20px] rounded-bl-md"
                            }`}
                          >
                            {m.attachmentType === "pdf" && (
                              <Link
                                href={`${process.env.NEXT_PUBLIC_API_URL}${m.attachmentUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1.5 text-xs underline text-inherit ${
                                  showBody ? "mb-1.5" : ""
                                }`}
                              >
                                <FiFileText size={14} />
                                <span>View PDF</span>
                              </Link>
                            )}
                            {showBody && (
                              <p className="whitespace-pre-wrap break-words">
                                {m.body}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Pending Attachment Preview */}
              {pendingFile && (
                <div className="px-3 sm:px-4 pt-3 border-t border-zinc-800/60 bg-black shrink-0">
                  <div className="flex items-center gap-3 bg-zinc-900 rounded-xl p-2.5">
                    {pendingPreviewUrl &&
                    pendingFile.type.startsWith("image/") ? (
                      <img
                        src={pendingPreviewUrl}
                        alt="preview"
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : pendingPreviewUrl &&
                      pendingFile.type.startsWith("video/") ? (
                      <video
                        src={pendingPreviewUrl}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                        muted
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                        <FiFileText size={18} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {pendingFile.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {(pendingFile.size / 1024 / 1024).toFixed(1)} MB — ready
                        to send
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearPendingFile}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition shrink-0"
                      title="Remove"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Message Input Form */}
              <div className="p-3 sm:p-4 shrink-0">
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2 bg-zinc-900 rounded-full px-2 py-1.5"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,application/pdf"
                    onChange={handleAttachmentSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50 shrink-0"
                    title="Attach image, video, or PDF"
                  >
                    <FiPaperclip size={18} />
                  </button>
                  <input
                    type="text"
                    placeholder={
                      pendingFile ? "Add a caption (optional)..." : "Message..."
                    }
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="flex-1 bg-transparent px-1 py-1.5 text-white placeholder-zinc-500 text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || (!messageBody.trim() && !pendingFile)}
                    className="px-4 py-1.5 rounded-full text-primary hover:bg-zinc-800 text-sm font-bold transition disabled:opacity-40 disabled:hover:bg-transparent shrink-0 flex items-center justify-center"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Send"
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
}
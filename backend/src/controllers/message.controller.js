import { asyncHandler } from "../utils/asynchandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/messages.model.js";
import { Conversation } from "../models/conversation.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // 🔥 Import Cloudinary

// @desc    Send a message (Text and/or File)
export const sendMessage = asyncHandler(async (req, res) => {
    const { content, message } = req.body; 
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const finalContent = content || message;
    
    // 🔥 Handle File Upload via Multer
    let attachmentUrl = null;
    if (req.file) {
        const localFilePath = req.file.path;
        const uploadResult = await uploadOnCloudinary(localFilePath);
        
        if (!uploadResult) {
            throw new ApiError(500, "Failed to upload attachment to cloud storage");
        }
        attachmentUrl = uploadResult.secure_url; // Get the string URL
    }

    if (!finalContent && !attachmentUrl) {
        throw new ApiError(400, "Message content or an attachment is required");
    }

    // 1. Check for existing conversation
    let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [senderId, receiverId],
        });
    }

    // 2. Create the message with the string URL
    const newMessage = await Message.create({
        conversationId: conversation._id,
        sender: senderId,
        receiver: receiverId,
        content: finalContent,
        attachments: attachmentUrl, // 🔥 Save the Cloudinary URL string
    });

    // 3. Update the sidebar preview
    conversation.lastMessage = {
        text: finalContent ? finalContent : "📎 Attachment", 
        sender: senderId
    };
    await conversation.save();

    // 4. Socket Emission
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json(new ApiResponse(201, newMessage, "Message sent"));
});

// @desc    Get chat history between logged-in user and another user
export const getMessages = asyncHandler(async (req, res) => {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
        participants: { $all: [senderId, userToChatId] },
    });

    if (!conversation) {
        return res.status(200).json(new ApiResponse(200, [], "No messages yet"));
    }

    const messages = await Message.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 }); // Oldest to newest for chat flow

    return res.status(200).json(new ApiResponse(200, messages, "Messages fetched"));
});

// @desc    Get all active conversations for the sidebar
export const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const conversations = await Conversation.find({
        participants: { $in: [userId] }
    })
    .populate("participants", "name avatar activeMembership") // Get details of the people we are chatting with
    .sort({ updatedAt: -1 }); // Most recently active chats at the top

    return res.status(200).json(new ApiResponse(200, conversations, "Conversations fetched"));
});

// ==========================================
// 🔥 NEW: UNREAD MESSAGE LOGIC
// ==========================================

// @desc    Get all unread messages for the logged-in user
export const getUnreadMessages = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    // Find messages where YOU are the receiver, and the status is not 'read'
    const unreadMessages = await Message.find({
        receiver: userId,
        status: { $ne: "read" } 
    });

    return res.status(200).json(new ApiResponse(200, unreadMessages, "Unread messages fetched"));
});

// @desc    Mark all messages in a conversation as read
export const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { senderId } = req.body; // The person who sent the messages
    const receiverId = req.user._id; // You (the person reading them)

    // Update all unread messages from this sender to you
    await Message.updateMany(
        { sender: senderId, receiver: receiverId, status: { $ne: "read" } },
        { $set: { status: "read" } }
    );

    return res.status(200).json(new ApiResponse(200, null, "Messages marked as read"));
});
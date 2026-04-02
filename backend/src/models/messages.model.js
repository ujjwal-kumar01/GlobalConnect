import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // 🔥 ADDED: Crucial for tying messages to a specific chat room
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      // Not strictly required, because a user might send JUST an attachment with no text
    },

    attachments: {
      type: String,
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent"
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
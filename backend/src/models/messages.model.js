import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  content: String,

  attachments: String,

  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },

},{timestamps:true});

export const Message = mongoose.model("Message", messageSchema);
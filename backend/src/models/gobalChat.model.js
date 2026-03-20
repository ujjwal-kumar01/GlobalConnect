import mongoose from "mongoose";

const globalChatSchema = new mongoose.Schema({

  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College"
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  message: String,

},{timestamps:true});

export const GlobalChat = mongoose.model("GlobalChat", globalChatSchema);
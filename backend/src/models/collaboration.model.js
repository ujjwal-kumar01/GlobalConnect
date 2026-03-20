import mongoose, { Schema } from "mongoose";

const collaborationSchema = new Schema({

  collegeA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College"
  },

  collegeB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College"
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },

  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

},
{timestamps:true});

export const Collaboration = mongoose.model("Collaboration", collaborationSchema);
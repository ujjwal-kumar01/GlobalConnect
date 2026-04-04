import mongoose, { Schema } from "mongoose";

const globalMessageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    college: { type: Schema.Types.ObjectId, ref: "College", required: true },
    content: { type: String },
    attachments: { type: String }, // Store the Cloudinary URL
}, { timestamps: true });

export const GlobalMessage = mongoose.model("GlobalMessage", globalMessageSchema);
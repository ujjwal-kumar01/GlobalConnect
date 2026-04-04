import mongoose, { Schema } from "mongoose";

const postSchema = new Schema({
    college: { 
        type: Schema.Types.ObjectId, 
        ref: "College", 
        required: true 
    },
    author: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    type: { 
        type: String, 
        enum: ["event", "blog", "news"], 
        default: "news" 
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String }, // Cloudinary URL
    eventDate: { type: Date }, // Only for events
    isOfficial: { type: Boolean, default: true }
}, { timestamps: true });

export const Post = mongoose.model("Post", postSchema);
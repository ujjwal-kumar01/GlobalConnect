import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({

  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job"
  },

  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  resume: String,

  coverLetter: String,

  status: {
    type: String,
    enum: ["pending", "shortlisted", "rejected"],
    default: "pending"
  },

},{timestamps:true});

export const Application = mongoose.model("Application", applicationSchema);
import mongoose from "mongoose";
const jobSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  company: {
    type: String,
    required: true
  },

  description: String,

  location: String,

  salary: String,

  experience: String,

  skillsRequired: [String],

  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  targetColleges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "College"
  }],
},{timestamps:true});

export const Job = mongoose.model("Job", jobSchema);
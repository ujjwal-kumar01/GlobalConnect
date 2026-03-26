import mongoose, { Schema } from "mongoose";

const collegeSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  allowedDomains: [
    {
      type: String // e.g. "stanford.edu"
    }
  ],

  location: String,

  description: String,

  logo: String,

  super_admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  collaborations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "College"
  }],

}, {
  timestamps: true
}
);

export const College = mongoose.model("College", collegeSchema);
import mongoose, { Schema } from "mongoose";

const collegeSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  domain: String,

  location: String,

  description: String,

  logo: String,

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

},{
    timestamps:true
}
);

export const College = mongoose.model("College", collegeSchema);
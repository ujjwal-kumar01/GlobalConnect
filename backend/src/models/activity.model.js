import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
{
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    required: true,
    enum: [
      "USER_JOINED",
      "PROFILE_UPDATED",
      "CONNECTION_MADE",
      "JOB_POSTED",
      "JOB_APPLIED",
      "POST_CREATED",
      "COMMENT_ADDED",
      "COLLEGE_COLLABORATION",
      "EVENT_CREATED"
    ]
  },

  // optional readable message
  content: {
    type: String
  },

  // activity belonging to a specific college feed
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College"
  },

  // target user involved in activity
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // job reference (if job related activity)
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job"
  },

  // post reference (if post activity)
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  },

  // comment reference
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  },

  visibility: {
    type: String,
    enum: ["public", "college", "connections"],
    default: "college"
  }

},
{ timestamps: true }
);

export const Activity = mongoose.model("Activity", activitySchema);
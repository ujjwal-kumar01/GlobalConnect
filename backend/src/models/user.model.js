import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const membershipSchema = new Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    // Make college required for everyone EXCEPT recruiters
    required: function () {
      return this.role !== "recruiter";
    }
  },

  role: {
    type: String,
    enum: ["student", "alumni", "recruiter", "admin", "super_admin"],
    required: true
  },

  permissions: [
    {
      type: String,
      enum: [
        "manage_students",
        "manage_recruiters",
        "approve_students",
        "approve_recruiters",
        "post_jobs",
        "moderate_content"
      ]
    }
  ],

  isVerified: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      }
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true
    },

    avatar: String,

    // 🔥 NEW CORE SYSTEM
    memberships: [membershipSchema],

    primaryCollege: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College"
    },

    activeMembership: {
      college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "College"
      },
      role: String
    },

    // 🔒 Platform level super admin (NOT tied to college)
    isPlatformAdmin: {
      type: Boolean,
      default: false
    },

    location: String,
    branch: String,
    graduationYear: Number,

    company: String,
    position: String,

    skills: [String],
    bio: String,

    github: String,
    linkedin: String,

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    verification: {
      code: String,
      expiresAt: Date,
      purpose: {
        type: String,
        enum: ["email_verification", "password_reset"]
      }
    },

    connections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],

    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],

    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],

    refreshToken: String,

    lastSeen: Date,

    isOnline: {
      type: Boolean,
      default: false
    }

  },
  { timestamps: true }
);

// 🔐 Password Hash
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// 🔑 Password Check
userSchema.methods.isPasswordCorrect = async function (password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

// 🎟️ Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      activeMembership: this.activeMembership,
      isPlatformAdmin: this.isPlatformAdmin
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m"
    }
  );
};

// 🔄 Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "1d"
    }
  );
};

export const User = mongoose.model("User", userSchema);
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

    googleId: String,

    avatar: String,

    role: {
      type: String,
      required:true,
      enum: ["student", "alumni", "recruiter", "admin"],
      default: "student"
    },

    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College"
    },

    location: {
      type: String,
    },

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

userSchema.pre("save", async function(){
  if (!this.isModified("password")) return ;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function(password){
  if(!this.password) return false;
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m"
    }
  );
};

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
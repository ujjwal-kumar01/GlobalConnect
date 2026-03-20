import {User} from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asynchandlers.js"
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js";


/* =========================
   TOKEN GENERATION
========================= */

export const generateAccessAndRefreshTokens = async (userId) => {
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    user.refreshToken = hashedRefreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};


/* =========================
   REGISTER
========================= */

export const registerUser = asyncHandler(async (req, res) => {

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new ApiError(400, "User already exists");
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
        name,
        email,
        password, // let pre-save hash it
        role: role || "student",
        verification: {
            code: verificationCode,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            purpose: "email_verification",
        },
    });

    const emailResponse = await sendVerificationEmail(
        user.email,
        user.name,
        verificationCode
    );

    if (!emailResponse?.success) {
        throw new ApiError(500, "Failed to send verification email");
    }

    

    return res.status(201).json(
        new ApiResponse(201, null, "User registered. Complete profile.")
    );
});


/* =========================
   LOGIN
========================= */

export const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    if (!user.isEmailVerified) {
        throw new ApiError(403, "Please verify your email first");
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    };

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, { user: loggedInUser }, "Login successful")
        );
});


/* =========================
   UPDATE PROFILE
========================= */

export const updateProfile = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    const {
        name,
        bio,
        avatar,
        company,
        position,
        skills,
        github,
        linkedin,
        location,
        branch,
        graduationYear
    } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;

    if (company) updateData.company = company;
    if (position) updateData.position = position;

    if (github) updateData.github = github;
    if (linkedin) updateData.linkedin = linkedin;

    if (location) updateData.location = location;
    if (branch) updateData.branch = branch;
    if (graduationYear) updateData.graduationYear = graduationYear;

    // skills validation
    if (skills) {
        if (!Array.isArray(skills)) {
            throw new ApiError(400, "Skills must be an array");
        }
        updateData.skills = skills;
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile updated successfully")
    );
});

export const onboardingUser = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    const {
        role,
        college,
        company,
        position,
        graduationYear,
        branch,
        location,
        skills
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // update role if provided
    if (role && role !== user.role) {

        // Only allow student → alumni
        if (user.role === "student" && role === "alumni") {
            user.role = role;
        }
        else {
            throw new ApiError(403, "Role change not allowed");
        }
    }

    // 🔥 Role-based validation
    if (user.role === "student") {
        if (!college || !graduationYear) {
            throw new ApiError(400, "College and graduation year are required for students");
        }
        user.college = college;
        user.graduationYear = graduationYear;
        if (branch) user.branch = branch;
    }

    else if (user.role === "alumni") {

        if (!college || !graduationYear) {
            throw new ApiError(400, "College and graduation year are required for alumni");
        }

        user.college = college;
        user.graduationYear = graduationYear;

        if (company) user.company = company;
        if (position) user.position = position;
    }

    else if (user.role === "recruiter") {
        if (!company) {
            throw new ApiError(400, "Company is required for recruiters");
        }
        user.company = company;
        if (position) user.position = position;
    }

    else if (user.role === "admin") {
        if (!college) {
            throw new ApiError(400, "College is required for admin");
        }
        user.college = college;
    }

    // Common fields
    if (location) user.location = location;

    if (skills) {
        if (!Array.isArray(skills)) {
            throw new ApiError(400, "Skills must be an array");
        }
        user.skills = skills;
    }

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, user, "Onboarding completed successfully")
    );
});

/* =========================
   VERIFY EMAIL
========================= */

export const verifyEmail = asyncHandler(async (req, res) => {

    const userId = req.user?._id;
    const { code } = req.body;

    if (!code) {
        throw new ApiError(400, "Verification code is required");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email already verified");
    }

    const verification = user.verification;

    if (!verification || verification.purpose !== "email_verification") {
        throw new ApiError(400, "No verification request found");
    }

    if (String(verification.code) !== String(code)) {
        throw new ApiError(400, "Invalid verification code");
    }

    if (verification.expiresAt < new Date()) {
        throw new ApiError(400, "Verification code expired");
    }

    user.isEmailVerified = true;
    user.verification = null;

    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Email verified successfully"));
});


/* =========================
   RESEND CODE
========================= */

export const resendVerificationCode = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email already verified");
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.verification = {
        code: verifyCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        purpose: "email_verification",
    };

    await sendVerificationEmail(user.email, user.name, verifyCode);

    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Verification code resent"));
});


/* =========================
   LOGOUT
========================= */

export const logout = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1 },
    });

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    };

    return res
        .status(200)
        .clearCookie("accessToken", { ...options, maxAge: 0 })
        .clearCookie("refreshToken", { ...options, maxAge: 0 })
        .json(new ApiResponse(200, null, "Logout successful"));
});


/* =========================
   GET PROFILE
========================= */

export const getProfile = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id)
        .select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Profile fetched"));
});


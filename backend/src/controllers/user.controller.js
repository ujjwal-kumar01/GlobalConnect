import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandlers.js";
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js";

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

    // 🔹 Basic Info
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;

    // 🔹 Professional
    if (company) updateData.company = company;
    if (position) updateData.position = position;

    // 🔹 Social
    if (github) updateData.github = github;
    if (linkedin) updateData.linkedin = linkedin;

    // 🔹 Academic
    if (location) updateData.location = location;
    if (branch) updateData.branch = branch;
    if (graduationYear) updateData.graduationYear = graduationYear;

    // 🔹 Skills validation
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

export const googlelogin = asyncHandler(async (req, res) => {
    try {
        const { credentialResponse } = req.body;

        if (!credentialResponse) {
            throw new ApiError(400, "Google credential is required");
        }

        const ticket = await client.verifyIdToken({
            idToken: credentialResponse,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload?.email) {
            throw new ApiError(400, "Invalid Google token");
        }

        let user = await User.findOne({ email: payload.email });

        // 🔥 CREATE USER (NO ROLE HERE)
        if (!user) {
            user = await User.create({
                name: payload.name,
                email: payload.email,
                avatar: payload.picture,
                memberships: [], // ❗ important
                isEmailVerified: payload.email_verified,
                authProvider: "google",
                googleId: payload.sub,
            });
        } else {
            // update avatar if changed
            if (payload.picture) {
                user.avatar = payload.picture;
            }
            await user.save();
        }

        // 🚨 IMPORTANT: onboarding check
        if (!user.activeMembership && !user.isPlatformAdmin) {
            return res.status(200).json(
                new ApiResponse(200, {
                    user,
                    needsOnboarding: true
                }, "Complete onboarding")
            );
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        };

        const loggedInUser = await User.findById(user._id)
            .select("-password -refreshToken");

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, { user: loggedInUser }, "Google Login successful")
            );

    } catch (err) {
        throw new ApiError(401, err.message || "Google login failed");
    }
});

/* =========================
   TOKEN GENERATION
========================= */

export const generateAccessAndRefreshTokens = async (userId) => {
    const user = await User.findById(userId);

    if (!user) throw new ApiError(404, "User not found");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

/* =========================
   REGISTER
========================= */

export const registerUser = asyncHandler(async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError(400, "User already exists");

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
        name,
        email,
        password,
        memberships: [],
        verification: {
            code: verificationCode,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            purpose: "email_verification",
        },
    });

    await sendVerificationEmail(user.email, user.name, verificationCode);

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    };

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser }, "Registered successfully"));
});

/* =========================
   LOGIN
========================= */

export const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password required");
    }

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

    if (!user.isEmailVerified) {
        throw new ApiError(403, "Verify email first");
    }

    if (!user.activeMembership && !user.isPlatformAdmin) {
        throw new ApiError(403, "Complete onboarding first");
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    };

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser }, "Login successful"));
});

/* =========================
   ONBOARDING (CORE)
========================= */

export const onboardingUser = asyncHandler(async (req, res) => {

    const userId = req.user._id;

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

    if (!role) throw new ApiError(400, "Role is required");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    // 🚨 Restrictions
    if (["student", "admin", "super_admin"].includes(role)) {
        if (user.memberships.length > 0) {
            throw new ApiError(400, "Only one college allowed");
        }
    }

    // 🚨 Validations
    if (["student", "alumni"].includes(role)) {
        if (!college || !graduationYear) {
            throw new ApiError(400, "College & graduation year required");
        }
    }

    if (role === "recruiter" && !company) {
        throw new ApiError(400, "Company required");
    }

    if (["admin", "super_admin"].includes(role) && !college) {
        throw new ApiError(400, "College required");
    }

    // 🔥 Membership
    const membership = {
        college: college || null,
        role,
        permissions: role === "admin" ? [] : [],
        isVerified: role === "student" || role === "alumni" ? false : true
    };

    user.memberships.push(membership);

    // 🔥 Active Membership
    user.activeMembership = {
        college,
        role
    };

    if (!user.primaryCollege && college) {
        user.primaryCollege = college;
    }

    // 🔥 Role Data
    if (role === "student") {
        user.graduationYear = graduationYear;
        if (branch) user.branch = branch;
    }

    if (role === "alumni") {
        user.graduationYear = graduationYear;
        if (company) user.company = company;
        if (position) user.position = position;
    }

    if (role === "recruiter") {
        user.company = company;
        if (position) user.position = position;
    }

    if (location) user.location = location;

    if (skills) {
        if (!Array.isArray(skills)) {
            throw new ApiError(400, "Skills must be array");
        }
        user.skills = skills;
    }

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, user, "Onboarding completed")
    );
});

/* =========================
   SWITCH MEMBERSHIP
========================= */

export const switchMembership = asyncHandler(async (req, res) => {

    const { college, role } = req.body;

    const user = await User.findById(req.user._id);

    const membership = user.memberships.find(
        m => m.college?.toString() === college && m.role === role
    );

    if (!membership) {
        throw new ApiError(404, "Membership not found");
    }

    user.activeMembership = { college, role };

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, user, "Switched successfully")
    );
});

/* =========================
   VERIFY EMAIL
========================= */

export const verifyEmail = asyncHandler(async (req, res) => {

    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) throw new ApiError(404, "User not found");

    const verification = user.verification;

    if (!verification || verification.code !== code) {
        throw new ApiError(400, "Invalid code");
    }

    if (verification.expiresAt < new Date()) {
        throw new ApiError(400, "Code expired");
    }

    user.isEmailVerified = true;
    user.verification = null;

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Email verified")
    );
});

/* =========================
   LOGOUT
========================= */

export const logout = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1 },
    });

    return res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(new ApiResponse(200, null, "Logout successful"));
});

/* =========================
   GET PROFILE
========================= */

export const getProfile = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id)
        .select("-password -refreshToken");

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(
        new ApiResponse(200, user, "Profile fetched")
    );
});
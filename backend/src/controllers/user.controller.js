import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {College} from '../models/college.model.js'
import { Post } from "../models/post.model.js";
import {Application} from '../models/jobApplication.model.js'
import {Job} from '../models/job.model.js'

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandlers.js";
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'

/* =========================
   UPDATE PROFILE
========================= */

export const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    // 1. 🛡️ Text Field Whitelist (Removed 'avatar' from here, handled below)
    const allowedUpdates = [
        "name", "bio", "company", "position",
        "github", "linkedin", "location", "branch", "graduationYear"
    ];

    const updateData = {};

    // 2. ⚡ Dynamic Mapping for standard text fields
    allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });

    // 3. 🖼️ Handle Avatar Image Upload via Multer & Cloudinary
    if (req.file) {
        // req.file is populated by the Multer middleware
        const avatarLocalPath = req.file.path;
        
        // Upload to Cloudinary
        const avatarCloudinary = await uploadOnCloudinary(avatarLocalPath);

        if (!avatarCloudinary || !avatarCloudinary.secure_url) {
            throw new ApiError(500, "Error uploading avatar to Cloudinary");
        }

        // Save the secure URL to the database payload
        updateData.avatar = avatarCloudinary.secure_url;
    } else if (req.body.avatar === "") {
        // Allows the user to completely remove their profile picture if desired
        updateData.avatar = "";
    }

    // 4. 🎯 Handle Skills Array (Sent as Stringified JSON from FormData)
    if (req.body.skills !== undefined) {
        let parsedSkills = req.body.skills;
        
        // If it comes through as a string (which it will via FormData), parse it back into an array
        if (typeof parsedSkills === "string") {
            try {
                parsedSkills = JSON.parse(parsedSkills);
            } catch (error) {
                throw new ApiError(400, "Invalid skills format. Must be a valid JSON array.");
            }
        }

        if (!Array.isArray(parsedSkills)) {
            throw new ApiError(400, "Skills must be an array");
        }
        updateData.skills = parsedSkills;
    }

    // 5. 🛑 Performance Check
    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No valid fields provided for update");
    }

    // 6. 🚀 Execute the Database Update
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

export const getCurrentUser = asyncHandler(async (req, res) => {
  // 1. Ensure the user ID exists (Injected by your verifyJWT middleware)
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized access. Invalid or missing token.");
  }

  // 2. Fetch the user from the database
  // We explicitly remove the password and refreshToken from the result
  const currentUser = await User.findById(userId)
    .select("-password -refreshToken")
    // 🔥 OPTIONAL BUT HIGHLY RECOMMENDED: 
    // Populate the college references so your frontend gets the actual college names 
    // instead of just the raw ObjectIds!
    .populate({
      path: "memberships.college",
      select: "name location alumniCount" // Only pull the fields you actually need
    })
    .populate({
      path: "activeMembership.college",
      select: "name location"
    });

  // 3. Handle edge case where token is valid but user was deleted from DB
  if (!currentUser) {
    throw new ApiError(404, "User profile no longer exists.");
  }

  // 4. Send the fresh data back to the frontend
  return res.status(200).json(
    new ApiResponse(200, currentUser, "Current user fetched successfully.")
  );
});

export const requestCollegeAccess = asyncHandler(async (req, res) => {
  const { collegeId, role } = req.body;
  const userId = req.user?._id;
    
  // 1. Basic Validations
  if (!userId) {
    throw new ApiError(401, "Unauthorized request. Please log in.");
  }
  
  if (!collegeId || !role) {
    throw new ApiError(400, "College ID and intended role are required.");
  }

  // Ensure the requested role matches your Schema Enum
  const validRoles = ["student", "alumni", "recruiter", "admin"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role requested.");
  }

  // 2. Verify the target college actually exists in the database
  const targetCollege = await College.findById(collegeId);
  if (!targetCollege) {
    throw new ApiError(404, "The requested college could not be found.");
  }

  // 3. Fetch the user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // 4. 🛡️ Check for Duplicate Requests
  // Prevent the user from spamming the request button for the same college
  const existingMembership = user.memberships.find(
    (m) => m.college.toString() === collegeId.toString()
  );

  if (existingMembership) {
    if (existingMembership.isVerified) {
      throw new ApiError(400, `You are already a verified member of ${targetCollege.name}.`);
    } else {
      throw new ApiError(400, `Your access request for ${targetCollege.name} is already pending approval.`);
    }
  }

  // 5. Create the new pending membership object
  const newMembership = {
    college: collegeId,
    role: role,
    permissions: [], // Permissions are assigned by admins later (if applicable)
    isVerified: false // ⏳ Automatically marks it as 'Pending' for the Admin dashboard!
  };

  // Push the new request to their memberships array
  user.memberships.push(newMembership);

  // 6. UX Fallback: If this is their very first college request, set it as their active dashboard view
  if (!user.activeMembership || !user.activeMembership.college) {
    user.activeMembership = {
      college: collegeId,
      role: role
    };
  }

  // Save the updated user document
  await user.save();

  // 7. Send the response
  // Note: We don't need to send the full user object back because your frontend 
  // now perfectly calls `refreshUser()` immediately after this succeeds!
  return res.status(200).json(
    new ApiResponse(200, null, `Access request sent to ${targetCollege.name} successfully.`)
  );
});

export const switchActiveMembership = asyncHandler(async (req, res) => {
    const { collegeId, role } = req.body;
    console.log("hello")
    if (!collegeId || !role) {
        throw new ApiError(400, "College ID and Role are required to switch networks.");
    }

    // 1. Verify that the user actually belongs to this college and is verified
    const user = await User.findById(req.user._id);

    const hasMembership = user.memberships.find(m => 
        m.college.toString() === collegeId && 
        m.role === role
    );

    if (!hasMembership) {
        throw new ApiError(403, "You do not have a membership in this institution.");
    }

    if (!hasMembership.isVerified) {
        throw new ApiError(403, "Your membership for this institution is still pending approval.");
    }

    // 2. Update the activeMembership field
    user.activeMembership = {
        college: collegeId,
        role: role
    };

    await user.save({ validateBeforeSave: false });

    // 3. Return the updated user (or just success)
    // The frontend refreshUser(true) call will pick up these changes
    return res.status(200).json(
        new ApiResponse(200, user.activeMembership, "Successfully switched active network.")
    );
});

export const removeMyMembership = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;
  const userId = req.user._id;

  // Use $pull to safely remove ONLY this specific college from their array
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $pull: {
        memberships: { college: collegeId }
      }
    },
    { new: true }
  );

  // Fallback safety: If they just deleted the college they were currently viewing, reset active context
  if (updatedUser.activeMembership?.college?.toString() === collegeId.toString()) {
    if (updatedUser.memberships.length > 0) {
      updatedUser.activeMembership = {
        college: updatedUser.memberships[0].college,
        role: updatedUser.memberships[0].role
      };
    } else {
      updatedUser.activeMembership = null; 
    }
    await updatedUser.save();
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Successfully removed college from your networks.")
  );
});

export const getUserProfileById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required.");
    }

    // Find the user and exclude sensitive fields
    const targetUser = await User.findById(userId)
        .select("-password -refreshToken -verificationCode")
        // NOTE: If your activeMembership/college is a reference that needs populating, 
        // add the .populate() method here, for example:
        .populate("activeMembership.college", "name location")
        ;

    if (!targetUser) {
        throw new ApiError(404, "User profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, targetUser, "User profile fetched successfully.")
    );
});

export const getCollegePosts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const collegeId = req.user.activeMembership.college;
    const [posts, totalPosts] = await Promise.all([
        Post.find({ college: collegeId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("author", "name avatar"),
        Post.countDocuments({ college: collegeId })
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            posts,
            pagination: {
                totalPosts,
                totalPages: Math.ceil(totalPosts / limit),
                currentPage: page,
                hasNextPage: page * limit < totalPosts,
                hasPrevPage: page > 1
            }
        }, "Fetched successfully")
    );
});


export const getUserStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const role = req.user.activeMembership?.role;
    const collegeId = req.user.activeMembership?.college;

    let collegeCountRaw = 0;
    let mainCount = 0;
    let secondaryCount = 0;

    // 1. Logic for RECRUITER
    if (role === 'recruiter') {
        // collegeCount: Total verified students available on the platform (or specific college if tied)
        const query = collegeId 
            ? { memberships: { $elemMatch: { college: collegeId, role: 'student', isVerified: true } } }
            : { memberships: { $elemMatch: { role: 'student', isVerified: true } } };
        
        collegeCountRaw = await User.countDocuments(query);

        // mainCount: Active jobs posted by this recruiter
        const postedJobs = await Job.find({ postedBy: userId }).select("_id");
        const jobIds = postedJobs.map(job => job._id);
        mainCount = jobIds.length;

        // secondaryCount: Total applicants across all their jobs
        secondaryCount = await Application.countDocuments({ job: { $in: jobIds } });
    } 
    
    // 2. Logic for ALUMNI
    else if (role === 'alumni') {
        collegeCountRaw = await User.countDocuments({
            memberships: { $elemMatch: { college: collegeId, role: 'student', isVerified: true } }
        });

        const postedJobs = await Job.find({ postedBy: userId }).select("_id");
        const jobIds = postedJobs.map(job => job._id);
        
        mainCount = jobIds.length;
        // For Alumni, secondaryCount is total students they've helped/hired (shortlisted/accepted)
        secondaryCount = await Application.countDocuments({ 
            job: { $in: jobIds }, 
            status: { $in: ["shortlisted", "accepted"] } 
        });
    } 
    
    // 3. Logic for STUDENT
    else {
        collegeCountRaw = await User.countDocuments({
            memberships: { $elemMatch: { college: collegeId, role: 'alumni', isVerified: true } }
        });

        mainCount = await Application.countDocuments({ applicant: userId });
        secondaryCount = await Application.countDocuments({ 
            applicant: userId, 
            status: "shortlisted" 
        });
    }

    // Format the college count (e.g., 1200 -> 1.2k+)
    const collegeCountFormatted = collegeCountRaw > 999 
        ? `${(collegeCountRaw / 1000).toFixed(1)}k+` 
        : collegeCountRaw.toString();

    return res.status(200).json(
        new ApiResponse(200, {
            collegeCount: collegeCountFormatted,
            mainCount,      
            secondaryCount  
        }, "Real-time stats fetched successfully")
    );
});
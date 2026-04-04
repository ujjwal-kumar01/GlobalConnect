import { asyncHandler } from "../utils/asynchandlers.js";
import { User } from "../models/user.model.js";
import { College } from "../models/college.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Post} from '../models/post.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'

export const onboardingAdmin = asyncHandler(async (req, res) => {
  // 1. Extract domain from req.body
  const { mode, college, role, domain } = req.body;

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!college || !mode) {
    throw new ApiError(400, "Required fields missing");
  }

  if (!["join", "create"].includes(mode)) {
    throw new ApiError(400, "Invalid mode");
  }

  if (role !== "admin") {
    throw new ApiError(400, "Invalid role");
  }

  // 2. Validate domain specifically for the create flow
  if (mode === "create" && !domain) {
    throw new ApiError(400, "Domain is required when creating a new college network");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let targetCollege;

  // =========================
  // 🔹 CREATE FLOW
  // =========================
  if (mode === "create") {
    // Check if college already exists
    const existingCollege = await College.findOne({ name: college });

    if (existingCollege) {
      throw new ApiError(400, "College already exists. Try joining instead.");
    }

    // 3. Create new college and inject the domain!
    targetCollege = await College.create({
      name: college,
      super_admin: user._id,
      admins: [user._id],
      members: [user._id],
      // Store the domain dynamically (cleaned up just in case)
      allowedDomains: [domain.trim().toLowerCase()] 
    });

    // Create membership (auto verified for the creator)
    const membership = {
      college: targetCollege._id,
      role: "super_admin",
      permissions: [
        "manage_students",
        "manage_recruiters",
        "approve_students",
        "approve_recruiters",
        "post_jobs",
        "moderate_content"
      ],
      isVerified: true
    };

    user.memberships.push(membership);

    user.primaryCollege = targetCollege._id;
    user.activeMembership = {
      college: targetCollege._id,
      role: "super_admin"
    };
  }

  // =========================
  // 🔹 JOIN FLOW
  // =========================
  if (mode === "join") {
    targetCollege = await College.findOne({ name: college });

    if (!targetCollege) {
      throw new ApiError(404, "College not found");
    }

    // Prevent duplicate admin request
    const alreadyAdmin = user.memberships.some(
      (m) =>
        m.college.toString() === targetCollege._id.toString() &&
        (m.role === "admin" || m.role === "super_admin")
    );

    if (alreadyAdmin) {
      throw new ApiError(400, "Already an admin/member of this college");
    }

    const membership = {
      college: targetCollege._id,
      role: "admin",
      permissions: [], // will be granted after approval by the super_admin
      isVerified: false // 🔥 needs approval
    };

    user.memberships.push(membership);
  }

  await user.save();

  const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

  return res.status(200).json({
    success: true,
    message:
      mode === "create"
        ? "College created successfully 🎉 You are now Super Admin"
        : "Admin request sent ⏳ Awaiting approval",
    data: {
      college: targetCollege.name,
      role: mode === "create" ? "super_admin" : "admin",
      isVerified: mode === "create"
    },
    user:loggedInUser
  });
});

// --- 1. GET MEMBERS ---
export const getCollegeMembers = asyncHandler(async (req, res) => {
    // SECURITY: Get the college ID from the logged-in admin's secure session, NOT the URL parameter.
    const adminCollegeId = req.user?.activeMembership?.college;
    const { isVerified, role } = req.query;

    if (!adminCollegeId) {
        throw new ApiError(400, "Admin does not have an active college context.");
    }

    const isVerifiedStatus = isVerified === 'true';

    const membershipCriteria = {
        college: adminCollegeId,
        isVerified: isVerifiedStatus
    };

    if (role && role !== 'all' && role !== 'undefined') {
        membershipCriteria.role = role;
    }

    const users = await User.find({
        memberships: {
            $elemMatch: membershipCriteria
        }
    }).select("name email avatar position company branch graduationYear memberships");

    return res.status(200).json(
        new ApiResponse(200, users, `${isVerifiedStatus ? 'Verified members' : 'Pending requests'} fetched successfully.`)
    );
});


// --- 2. APPROVE MEMBER ---
export const verifyMember = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const adminCollegeId = req.user?.activeMembership?.college;

    if (!adminCollegeId) {
        throw new ApiError(400, "Admin college context missing.");
    }

    // 1. Find the user first to check their current active state
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    // 2. Find the specific membership index for the admin's college
    const membershipIndex = user.memberships.findIndex(
        (m) => m.college.toString() === adminCollegeId.toString()
    );

    if (membershipIndex === -1) {
        throw new ApiError(404, "User has no membership request for this college.");
    }

    // 3. Mark the membership as verified
    user.memberships[membershipIndex].isVerified = true;

    // 4. 🔥 NEW LOGIC: Set activeMembership if it's currently null or empty
    // We check if the object exists and if it has a role property
    if (!user.activeMembership || !user.activeMembership.role) {
        user.activeMembership = {
            college: adminCollegeId,
            role: user.memberships[membershipIndex].role
        };
    }

    // 5. Save the user
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, null, "User approved and active context initialized.")
    );
});


// --- 3. REJECT/REMOVE MEMBER ---
export const removeMember = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const adminCollegeId = req.user?.activeMembership?.college;

    if (!adminCollegeId) {
        throw new ApiError(400, "Admin college context missing.");
    }

    // 1. Remove the membership from the array
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { memberships: { college: adminCollegeId } } },
        { new: true }
    );

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    // 2. Check if the removed college was their active context
    const wasActiveContext = updatedUser.activeMembership?.college?.toString() === adminCollegeId.toString();

    if (wasActiveContext) {
        // Find the first available VERIFIED membership as a fallback
        const fallbackMembership = updatedUser.memberships.find(m => m.isVerified === true);

        if (fallbackMembership) {
            // Switch them to another verified college automatically
            updatedUser.activeMembership = {
                college: fallbackMembership.college,
                role: fallbackMembership.role
            };
        } else if (updatedUser.memberships.length > 0) {
            // If none are verified, but they have pending ones, 
            // pick the first pending one so they aren't stuck with a deleted ID
            updatedUser.activeMembership = {
                college: updatedUser.memberships[0].college,
                role: updatedUser.memberships[0].role
            };
        } else {
            // 🔥 No memberships left at all: Clear the context entirely
            updatedUser.activeMembership = null;
        }

        await updatedUser.save({ validateBeforeSave: false });
    }

    return res.status(200).json(
        new ApiResponse(200, null, "User removed and active context updated.")
    );
});

export const getAdminStats = asyncHandler(async (req, res) => {
    const adminCollegeId = req.user?.activeMembership?.college;

    if (!adminCollegeId) throw new ApiError(400, "College context missing");

    // Since memberships are in the User array, we query the User collection
    const [members, recruiters, pending, totalPosts] = await Promise.all([
        User.countDocuments({ memberships: { $elemMatch: { college: adminCollegeId, role: { $in: ['student', 'alumni'] }, isVerified: true } } }),
        User.countDocuments({ memberships: { $elemMatch: { college: adminCollegeId, role: 'recruiter', isVerified: true } } }),
        User.countDocuments({ memberships: { $elemMatch: { college: adminCollegeId, isVerified: false } } }),
        Post.countDocuments({ college: adminCollegeId })
    ]);

    return res.status(200).json(new ApiResponse(200, {
        members,
        recruiters,
        broadcasts: totalPosts,
        pending
    }, "Stats fetched"));
});

// --- POSTS ---
export const createCollegePost = asyncHandler(async (req, res) => {
    const { title, content, type, eventDate } = req.body;
    const collegeId = req.user.activeMembership.college;
    let imageUrl = null;
    if (req.file) {
      const uploadResult = await uploadOnCloudinary(req.file.path);
      imageUrl = uploadResult?.secure_url;
    }
    console.log("hello")

    const post = await Post.create({
        title,
        content,
        type,
        eventDate: type === 'event' ? eventDate : null,
        image: imageUrl,
        college: collegeId,
        author: req.user._id,
        isOfficial: true
    });

    return res.status(201).json(new ApiResponse(201, post, "Post published successfully"));
});

// @desc    Delete a college post
export const deleteCollegePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // Authorization: Only the author OR a Super Admin can delete
    const isAuthor = post.author.toString() === userId.toString();
    const isSuperAdmin = req.user.activeMembership.role === "super_admin";

    if (!isAuthor && !isSuperAdmin) {
        throw new ApiError(403, "You are not authorized to delete this post");
    }

    await Post.findByIdAndDelete(postId);

    return res.status(200).json(
        new ApiResponse(200, null, "Post deleted successfully")
    );
});
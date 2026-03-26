import { asyncHandler } from "../utils/asynchandlers.js";
import { User } from "../models/user.model.js";
import { College } from "../models/college.model.js";
import { ApiError } from "../utils/ApiError.js";

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
    }
  });
});
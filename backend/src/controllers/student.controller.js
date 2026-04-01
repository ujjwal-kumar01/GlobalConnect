import { asyncHandler } from "../utils/asynchandlers.js";
import { User } from "../models/user.model.js";
import { College } from "../models/college.model.js";
import { ApiError } from "../utils/ApiError.js";

const getEmailDomain = (email) => {
  return email.split("@")[1]?.toLowerCase();
};

export const onboardingAcademic = asyncHandler(async (req, res) => {
  const { college, graduationYear, position, company, role } = req.body;

  // 🔒 Get logged-in user
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  // ✅ Validation
  if (!college || !graduationYear || !role) {
    throw new ApiError(400, "Required fields missing");
  }

  if (!["student", "alumni"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  // 🔍 Find college
  const foundCollege = await College.findOne({ name: college });

  if (!foundCollege) {
    throw new ApiError(404, "College not found");
  }

  // 👤 Get user
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 🔥 EMAIL DOMAIN CHECK
  const userEmail = user.email;
  const domain = getEmailDomain(userEmail);

  const isValidDomain = foundCollege.allowedDomains?.includes(domain);

  // 🧩 Create membership
  const membership = {
    college: foundCollege._id,
    role: role,
    permissions: [],
    isVerified: isValidDomain || false // ✅ auto verify if domain matches
  };

  // 🚫 Prevent duplicate membership
  const alreadyMember = user.memberships.some(
    (m) =>
      m.college.toString() === foundCollege._id.toString() &&
      m.role === role
  );

  if (!alreadyMember) {
    user.memberships.push(membership);
  }

  // ⭐ Set primary + active
  user.primaryCollege = foundCollege._id;
  user.activeMembership = {
    college: foundCollege._id,
    role: role
  };

  // 📚 Academic + professional info
  user.graduationYear = graduationYear;
  user.position = position;
  user.company = company;

  await user.save();

  // 🔗 Add user to college members
  if (!foundCollege.members.includes(user._id)) {
    foundCollege.members.push(user._id);
    await foundCollege.save();
  }

  const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

  return res.status(200).json({
    success: true,
    message: isValidDomain
      ? "Onboarding completed (Auto Verified 🎉)"
      : "Onboarding completed (Pending Verification ⏳)",
    data: {
      userId: user._id,
      college: foundCollege.name,
      role: role,
      isVerified: isValidDomain || false
    },
    user:loggedInUser
  });
});

export const allAlumni = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  // 🔍 Get current user
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const activeCollegeId = user.activeMembership?.college;

  if (!activeCollegeId) {
    throw new ApiError(400, "No active college selected");
  }

  // 🎯 Find all alumni in same college, excluding the current user
  const alumni = await User.find({
    _id: { $ne: userId }, // 🔥 Excludes the current logged-in user
    memberships: {
      $elemMatch: {
        college: activeCollegeId,
        role: "alumni",
        isVerified: true // 🔥 optional but recommended
      }
    }
  })
    .select("-password -refreshToken -verification") // 🔒 clean response
    .lean();

  return res.status(200).json({
    success: true,
    count: alumni.length,
    data: alumni
  });
});


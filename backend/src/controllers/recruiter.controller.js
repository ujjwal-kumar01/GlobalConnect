import { asyncHandler } from "../utils/asynchandlers.js";
import { User } from "../models/user.model.js";
import { College } from "../models/college.model.js";
import { ApiError } from "../utils/ApiError.js";

export const onboardingRecruiter = asyncHandler(async (req, res) => {
  // 1. Extract data, now including 'college'
  const { college, company, position, location, role } = req.body;
  const userId = req.user?._id;

  // 2. Initial Validations
  if (!userId) {
    throw new ApiError(401, "Unauthorized access. Please log in.");
  }

  if (!college || !company || !position) {
    throw new ApiError(400, "College, Company, and Position are required fields.");
  }

  if (role !== "recruiter") {
    throw new ApiError(400, "Invalid role specified for this onboarding flow.");
  }

  // 3. Look up the requested College by name to get its ObjectId
  const targetCollege = await College.findOne({ name: college });

  if (!targetCollege) {
    throw new ApiError(404, "Selected institution not found in our records.");
  }

  // 4. Find the user in the database
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  // 5. Update the User's core professional fields
  user.company = company.trim();
  user.position = position.trim();

  if (location) {
    user.location = location.trim();
  }

  // 6. Prevent Duplicate Memberships for this specific college
  const alreadyRecruitingHere = user.memberships.some(
    (m) =>
      m.college.toString() === targetCollege._id.toString() &&
      m.role === "recruiter"
  );

  if (!alreadyRecruitingHere) {
    // Add the specific college membership
    user.memberships.push({
      college: targetCollege._id, // Now tied to the real college!
      role: "recruiter",
      permissions: ["post_jobs"],
      isVerified: false // Needs admin approval to actually post jobs/view talent
    });

    // Update active context
    user.activeMembership = {
      college: targetCollege._id,
      role: "recruiter"
    };
  }

  // 7. Save the updated user document
  await user.save();

  const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken");

  // 8. Send the success response
  return res.status(200).json({
    success: true,
    message: "Recruiter profile and access request submitted successfully.",
    data: {
      college: targetCollege.name,
      company: user.company,
      position: user.position,
      role: "recruiter",
      isVerified: false
    },
    user:loggedInUser
  });
});


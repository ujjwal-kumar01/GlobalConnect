import { asyncHandler } from "../utils/asynchandlers.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

export const getDashboardRecommendations = asyncHandler(async (req, res) => {
    const collegeId = req.user.activeMembership.college;
    const userRole = req.user.activeMembership.role;
    const userBranch = req.user.branch;

    let recommendations = [];

    if (userRole === 'student') {
        // Recommend Alumni from same branch
        const alumni = await User.find({
            _id: { $ne: req.user._id },
            branch: userBranch,
            memberships: { $elemMatch: { college: collegeId, role: 'alumni', isVerified: true } }
        }).limit(3).select("name position company avatar");

        recommendations = alumni.map(u => ({
            id: u._id,
            name: u.name,
            avatar: u.avatar,
            bg: "bg-orange-100 text-orange-600",
            role: u.position || "Verified Alumni",
            company: u.company || "Industry Professional",
            time: "Alumni",
            isNew: true
        }));
    } else {
        // Recommend Students for Alumni
        const students = await User.find({
            _id: { $ne: req.user._id },
            branch: userBranch,
            memberships: { $elemMatch: { college: collegeId, role: 'student', isVerified: true } }
        }).limit(3).select("name branch graduationYear avatar");

        recommendations = students.map(u => ({
            id: u._id,
            name: u.name,
            avatar: u.avatar,
            bg: "bg-blue-100 text-blue-600",
            role: `Student (${u.branch})`,
            company: `Class of ${u.graduationYear}`,
            time: "Student",
            isNew: false
        }));
    }

    return res.status(200).json(new ApiResponse(200, recommendations, "Recommendations fetched"));
});
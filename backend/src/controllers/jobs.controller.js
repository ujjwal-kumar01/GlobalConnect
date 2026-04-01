import { asyncHandler } from "../utils/asynchandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { College } from "../models/college.model.js"; 
import {Application} from '../models/jobApplication.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js"; 

export const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    company,
    location,
    salary,
    experience,
    description,
    skillsRequired,
    targetColleges,
  } = req.body;

  // console.log("hello")

  // 1. Validate required fields
  if (!title || !company) {
    throw new ApiError(400, "Job title and company name are required.");
  }

  if (!targetColleges || !Array.isArray(targetColleges) || targetColleges.length === 0) {
    throw new ApiError(400, "At least one target institution must be selected.");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request. Please log in.");
  }

  // 2. Fetch the user to check their memberships
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // 3. Fetch the names of all targeted colleges for error reporting
  // The $in operator finds all colleges whose IDs match the array sent from the frontend
  const selectedCollegesData = await College.find({
    _id: { $in: targetColleges }
  }).select("name");

  // Create a quick lookup dictionary: { "60f1...": "Harvard University" }
  const collegeNamesMap = selectedCollegesData.reduce((acc, col) => {
    acc[col._id.toString()] = col.name;
    return acc;
  }, {});

  // 4. 🛡️ PERMISSION ENGINE: Validate access for EVERY target college
  if (!user.isPlatformAdmin) {
    for (const collegeId of targetColleges) {
      
      // Look up the human-readable name we just fetched
      const collegeName = collegeNamesMap[collegeId.toString()] || "Unknown College";

      const membership = user.memberships.find(
        (m) => m.college.toString() === collegeId.toString()
      );

      // Rule A: Do they belong to this college?
      if (!membership) {
        throw new ApiError(403, `Access Denied: You are not registered with ${collegeName}.`);
      }

      // Rule B: Is their membership verified by an admin?
      if (!membership.isVerified) {
        throw new ApiError(403, `Access Denied: Your account is pending verification for ${collegeName}.`);
      }

      // 🔥 Rule C: The precise role & permission check
      // Allowed roles bypass the explicit permission array check.
      const allowedRoles = ["super_admin", "admin", "recruiter", "alumni"];
      
      const hasPostJobsPermission = 
        allowedRoles.includes(membership.role) || 
        membership.permissions.includes("post_jobs"); // Catch-all for any custom student overrides

      if (!hasPostJobsPermission) {
        throw new ApiError(403, `Access Denied: You do not have the required permissions to post jobs to ${collegeName}.`);
      }
    }
  }

  // 5. Create the Job document in the database
  const newJob = await Job.create({
    title: title.trim(),
    company: company.trim(),
    location: location?.trim() || "",
    salary: salary?.trim() || "",
    experience: experience?.trim() || "",
    description: description?.trim() || "",
    skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : [],
    targetColleges: targetColleges, 
    postedBy: userId, 
  });

  // 6. Verify creation and send response
  if (!newJob) {
    throw new ApiError(500, "Something went wrong while posting the job.");
  }

  return res.status(201).json(
    new ApiResponse(201, newJob, "Job posted successfully!")
  );
});

// 1. Get all jobs posted by the logged-in recruiter
export const getMyPostedJobs = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Fetch jobs and sort them by newest first
    const jobs = await Job.find({ postedBy: userId }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, jobs, "Jobs fetched successfully"));
});

// 2. Get all applications for a specific job
export const getJobApplications = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user._id;

    // Security Check: Ensure the recruiter actually owns this job before showing applicants!
    const job = await Job.findOne({ _id: jobId, postedBy: userId });
    if (!job) {
        throw new ApiError(403, "You do not have permission to view applicants for this job.");
    }

    // Fetch applications and populate the applicant's basic info
    const applications = await Application.find({ job: jobId })
        .populate("applicant", "name email avatar") // Grabs specific fields from User model
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, applications, "Applicants fetched successfully"));
});

// 3. Update application status (Pending -> Shortlisted)
export const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!["pending", "shortlisted", "rejected"].includes(status)) {
        throw new ApiError(400, "Invalid status provided.");
    }

    // Optional: Add a security check here to ensure the recruiter owns the job associated with this application

    const updatedApp = await Application.findByIdAndUpdate(
        applicationId,
        { $set: { status: status } },
        { new: true }
    );

    if (!updatedApp) {
        throw new ApiError(404, "Application not found.");
    }

    return res.status(200).json(new ApiResponse(200, updatedApp, "Status updated successfully"));
});


export const getCampusJobs = asyncHandler(async (req, res) => {
  
    const userCollegeId = req.user?.activeMembership?.college;
    const userId = req.user._id;
    if (!userCollegeId) {
        throw new ApiError(400, "You must be part of a college network to view jobs.");
    }

    // 1. Fetch all jobs where this college is in the targetColleges array
    const jobs = await Job.find({ targetColleges: userCollegeId })
        .populate("postedBy", "name company avatar")
        .sort({ createdAt: -1 });

    // 2. Fetch all jobs this specific user has already applied to
    // We send this array to the frontend so it can gray out the "Apply" buttons!
    const userApplications = await Application.find({ applicant: userId }).select("job");
    const appliedJobIds = userApplications.map(app => app.job);

    return res.status(200).json(
        new ApiResponse(200, { jobs, appliedJobIds }, "Campus jobs fetched successfully")
    );
});

export const applyForJob = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user._id;
    const userRole = req.user?.activeMembership?.role;

    // SECURITY: Block anyone who is not a student
    if (userRole !== 'student') {
        throw new ApiError(403, "Access Denied: Only active students can apply for campus placements.");
    }

    const job = await Job.findById(jobId);
    if (!job) throw new ApiError(404, "Job not found.");

    const existingApplication = await Application.findOne({ job: jobId, applicant: userId });
    if (existingApplication) {
        throw new ApiError(400, "You have already applied for this position.");
    }

    // 🚨 Handle the Resume Upload via Multer & Cloudinary
    let resumeUrl = null;
    if (req.file) {
        const resumeLocalPath = req.file.path;
        const uploadResult = await uploadOnCloudinary(resumeLocalPath);
        
        if (!uploadResult || !uploadResult.secure_url) {
            throw new ApiError(500, "Failed to upload resume to server.");
        }
        console.log(uploadResult)
        resumeUrl = uploadResult.secure_url;
    } else {
        throw new ApiError(400, "Resume file is required to apply.");
    }

    // Create the Application
    const application = await Application.create({
        job: jobId,
        applicant: userId,
        status: "pending",
        resume: resumeUrl // Save the Cloudinary URL!
    });

    return res.status(201).json(
        new ApiResponse(201, application, "Application submitted successfully!")
    );
});

export const getMyApplications = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Fetch the user's applications and populate the associated job details
    const applications = await Application.find({ applicant: userId })
        .populate("job", "title company location salary experience") 
        .sort({ createdAt: -1 }); // Newest first

    return res.status(200).json(
        new ApiResponse(200, applications, "Your applications fetched successfully")
    );
});

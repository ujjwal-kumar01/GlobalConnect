import { College } from "../models/college.model.js";
import { asyncHandler } from "../utils/asynchandlers.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 

export const getColleges = asyncHandler(async (req, res) => {
  const colleges = await College.find().select("name -_id");

  const formatted = colleges.map(college => college.name);

  return res.status(200).json(formatted);
});

export const getByCollegeName = asyncHandler(async (req, res) => {
  const { search } = req.query;

  let query = {};

  if (search) {
    query = {
      $or: [
        { name: { $regex: search, $options: "i" } },     // 'i' makes it case-insensitive
        { location: { $regex: search, $options: "i" } }  // Optional: lets them search by city too!
      ]
    };
  }

  const colleges = await College.find(query)
    .select("name location alumniCount") // Only send the fields the frontend actually needs
    .limit(50); 

  return res.status(200).json(
    new ApiResponse(200, colleges, "Colleges fetched successfully")
  );
});

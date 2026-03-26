import { College } from "../models/college.model.js";
import { asyncHandler } from "../utils/asynchandlers.js";

export const getColleges = asyncHandler(async (req, res) => {
  const colleges = await College.find().select("name -_id");

  const formatted = colleges.map(college => college.name);

  return res.status(200).json(formatted);
});


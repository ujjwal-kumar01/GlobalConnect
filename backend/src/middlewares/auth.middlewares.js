import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js";

export const verifyJWT = async (req, res, next) => {
  try {

    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");
      console.log(token)
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (typeof decodedToken === "string" || !decodedToken?._id) {
      throw new ApiError(401, "Invalid Access Token");
    }

    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;

    next();

  } catch (error) {
    next(new ApiError(401, error?.message || "Invalid access token"));
  }
};
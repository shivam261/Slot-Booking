import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const isStudent = asyncHandler(async (req, res, next) => {
    const token =req.cookies?.accessToken|| req.headers?.authorization?.split(" ")[1];
    if (!token) {
        return next(new ApiError(401,"You are not logged in"));
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded.role !== "student") {
        return next(new ApiError(403,"You are not a student"));
    }
    req.user = decoded;
    next();
    });
export { isStudent };
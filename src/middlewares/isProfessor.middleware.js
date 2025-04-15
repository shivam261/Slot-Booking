import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const isProfessor = asyncHandler(async (req, res, next) => {
    const token =req.cookies?.accessToken|| req.headers?.authorization?.split(" ")[1];
    if (!token) {
        return next(new ApiError(401,"You are not logged in"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Professor") {
        return next(new ApiError(403,"You are not a Professor"));
    }
    req.user = decoded;
    next();
    });
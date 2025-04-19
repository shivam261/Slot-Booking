import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { pool } from "../db/connectDb.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const registerStudent = asyncHandler(async (req, res, next) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password ) {
        return next(new ApiError(400, "Please provide all required fields"));
    }

    const existingStudent = await pool.query("SELECT * FROM students WHERE email = $1", [email]);

    if (existingStudent.rows.length > 0) {
        return next(new ApiError(409, "Student already exists"));
    }
    const salt=await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = await pool.query(
        "INSERT INTO students (name, email, password) VALUES ($1, $2, $3) RETURNING *",
        [name, email, hashedPassword]
    );
    res.status(201).json(new ApiResponse(200,newStudent.rows[0],"Student registered successfully"));
});
const loginStudent = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ApiError(400, "Please provide all required fields"));
    }

    const student = await pool.query("SELECT *  FROM students WHERE email = $1", [email]);

    if (student.rows.length === 0) {
        return next(new ApiError(401, "Invalid email or password"));
    }
    const isMatch=await bcrypt.compare(password,student.rows[0].password);
    if (!isMatch) {
        return next(new ApiError(401, "Invalid email or password"));
    }
    const token = jwt.sign({ id: student.rows[0].id, role: "student" }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
    });
    
    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 3600000 // 1 hour
    });
    
    res.status(200).json(new ApiResponse(200,student.rows[0].id,"Student Authenticated successfully"));
});
const getSlots = asyncHandler(async (req, res, next) => {
    const studentId = req.user.id;
    const slots = await pool.query("SELECT * FROM time_slots WHERE status = $1 ", ["available"]);

    if (slots.rows.length === 0) {
        return next(new ApiError(404, "No slots found"));
    }

    res.status(200).json(new ApiResponse(200, slots.rows, "Slots retrieved successfully"));
});
const getBookings = asyncHandler(async (req, res, next) => {
    const studentId = req.user.id;
    const bookings = await pool.query("SELECT * FROM bookings WHERE student_id = $1", [studentId]);

    if (bookings.rows.length === 0) {
        return next(new ApiError(404, "No bookings found"));
    }

    res.status(200).json(new ApiResponse(200, bookings.rows, "Bookings retrieved successfully"));

});
const createBooking = asyncHandler(async (req, res, next) => {
    const { slotId } = req.body;
    const studentId = req.user.id;
    if (!slotId) {
        return next(new ApiError(400, "Please provide all required fields"));
    }
    
    const slot = await pool.query("SELECT * FROM time_slots WHERE id = $1", [slotId]);
    
    if (slot.rows.length === 0) {
        return next(new ApiError(404, `slot not found ${slotId}`));
    }
    
    if (slot.rows[0].status !== "available") {
        return next(new ApiError(400, "Slot is not available"));
    }
    
    const newBooking = await pool.query(
        `INSERT INTO bookings (student_id, time_slot_id, status)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [studentId, slotId, 'active']
    );


    await pool.query("UPDATE time_slots SET status = $1 WHERE id = $2", ["booked", slotId]);

    res.status(201).json(new ApiResponse(200, newBooking.rows[0], "Booking created successfully"));
});
export { registerStudent, loginStudent, getSlots, getBookings ,createBooking} ;
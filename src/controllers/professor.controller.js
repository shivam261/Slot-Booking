import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { pool } from "../db/connectDb.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const registerProfessor = asyncHandler(async (req, res, next) => {
    
    const { name, email, password } = req.body;

    if (!name || !email || !password ) {
        
        return next(new ApiError(400, "Please provide all required fields"));
    }

    const existingProfessors = await pool.query("SELECT * FROM professors WHERE email = $1", [email]);

    if (existingProfessors.rows.length > 0) {
        return next(new ApiError(409, "Professor already exists"));
    }
    const salt=await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newProfessor = await pool.query(
        "INSERT INTO professors (name, email, password) VALUES ($1, $2, $3) RETURNING *",
        [name, email, hashedPassword]
    );
    res.status(201).json(new ApiResponse(200,newProfessor.rows[0],"Professor registered successfully"));
});
const loginProfessor = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ApiError(400, "Please provide all required fields"));
    }
    
    const professor = await pool.query("SELECT * FROM professors WHERE email = $1", [email]);

    if (professor.rows.length === 0) {
        return next(new ApiError(401, "Invalid email or password"));
    }

    const isMatch=await bcrypt.compare(password,professor.rows[0].password);
    
    if (!isMatch) {
        return next(new ApiError(401, "Invalid email or password"));
    }
    
     const token = jwt.sign({ id: professor.rows[0].id, role: "Professor" }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
    });

    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.PRODUCTION === 'production',
        sameSite: 'Strict',
        maxAge: 3600000 // 1 hour
    }); 
    
    res.status(200).json(new ApiResponse(200,professor.rows[0],"Professor logged in successfully"));
});
const createTimeSlot = asyncHandler(async (req, res, next) => {
    const {  startTime, endTime } = req.body;
    const professorId = req.user.id;

    if (!professorId || !startTime || !endTime) {
        return next(new ApiError(400, "Please provide professorId, startTime and endTime"));
    }

    if (new Date(startTime) >= new Date(endTime)) {
        return next(new ApiError(400, "startTime must be before endTime"));
    }

    try {
        const newSlot = await pool.query(
            `INSERT INTO time_slots (professor_id, start_time, end_time) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [professorId, startTime, endTime]
        );

        res.status(201).json(new ApiResponse(201, newSlot.rows[0], "Time slot created successfully"));
    } catch (error) {
        if (error.code === '23505') {
            return next(new ApiError(409, "Professor already has a time slot at that time"));
        }
        if (error.code === '23P01') {
            return next(new ApiError(409, "Overlapping time slot not allowed"));
        }
        return next(new ApiError(500, "Something went wrong"));
    }
});
const getTimeSlots = asyncHandler(async (req, res, next) => {
    const professorId = req.user.id;

    if (!professorId) {
        return next(new ApiError(400, "Please provide professorId"));
    }

    const slots = await pool.query("SELECT * FROM time_slots WHERE professor_id = $1", [professorId]);

    if (slots.rows.length === 0) {
        return next(new ApiError(404, "No time slots found"));
    }

    res.status(200).json(new ApiResponse(200, slots.rows, "Time slots retrieved successfully"));
});
const getBookingsByProfessor = asyncHandler(async (req, res, next) => {
    const professorId = req.user.id;

    if (!professorId) {
        return next(new ApiError(400, "Please provide professorId"));
    }

    const bookings = await pool.query(
        `SELECT b.*, s.start_time, s.end_time
         FROM bookings b
         JOIN time_slots s ON b.time_slot_id = s.id
         WHERE s.professor_id = $1`,
        [professorId]
    );

    if (bookings.rows.length === 0) {
        return next(new ApiError(404, "No bookings found for this professor"));
    }

    res.status(200).json(new ApiResponse(200, bookings.rows, "Bookings retrieved successfully"));
});
const cancelBookingByProfessor = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.params;
    const professorId = req.user.id; // from JWT or session middleware

    // Step 1: Ensure the booking belongs to professor's time slot
    const checkQuery = `
        SELECT b.id, b.time_slot_id
        FROM bookings b
        JOIN time_slots t ON b.time_slot_id = t.id
        WHERE b.id = $1 AND t.professor_id = $2
    `;

    const result = await pool.query(checkQuery, [bookingId, professorId]);

    if (result.rows.length === 0) {
        return next(new ApiError(403, "Unauthorized or booking not found"));
    }

    const timeSlotId = result.rows[0].time_slot_id;

    // Step 2: Cancel the booking
    await pool.query(
        `UPDATE bookings SET status = 'cancelled' WHERE id = $1`,
        [bookingId]
    );

    // Step 3: Update the time slot status to available
    await pool.query(
        `UPDATE time_slots SET status = 'available' WHERE id = $1`,
        [timeSlotId]
    );

    res.status(200).json(new ApiResponse(200, null, "Booking cancelled and time slot set to available"));
});

export { registerProfessor, loginProfessor,createTimeSlot,getTimeSlots,getBookingsByProfessor,cancelBookingByProfessor };

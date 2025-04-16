import { Router } from "express";
import { registerProfessor, loginProfessor,createTimeSlot,getTimeSlots,getBookingsByProfessor,cancelBookingByProfessor } from "../controllers/professor.controller.js"
import { isProfessor } from "../middlewares/isProfessor.middleware.js";
const router= Router();

router.route('/register').post(registerProfessor);
router.route('/login').post(loginProfessor);
router.route('/createSlot').post(isProfessor,createTimeSlot);
router.route('/getTimeSlots').get(isProfessor,getTimeSlots);
router.route('/getBookings').get(isProfessor,getBookingsByProfessor);
router.route('/cancelBooking/:bookingId').delete(isProfessor,cancelBookingByProfessor);
export default router;
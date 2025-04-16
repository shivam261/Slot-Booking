import { Router } from "express";
const router = Router();
import { registerStudent, loginStudent,getSlots,getBookings ,createBooking} from "../controllers/student.controller.js";

import { isStudent } from "../middlewares/isStudent.middleware.js";

router.route('/register').post(registerStudent);
router.route('/login').post(loginStudent);
router.route('/getSlots').get(isStudent,getSlots);
router.route('/getBookings').get(isStudent,getBookings);
router.route('/createBooking').post(isStudent,createBooking);
export default router;
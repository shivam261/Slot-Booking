import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {ApiError} from './utils/apiError.js';
const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.error,
        message: err.message,
      });
    } else {
      // Handle other types of errors
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
export {app};

import dotenv from 'dotenv';
import { app } from './app.js';
import connectDatabase from './db/connectDb.js';
import path from 'path';

//dotenv.config({ path: "../env" });
connectDatabase()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error in connecting to database", err);
    process.exit(1);
  });

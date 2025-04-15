/* import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDatabase = async () => {
    
    try{
        
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("database connected successfully");
    }catch(err){
        console.log("Error connecting to database",err);
        process.exit(1);
    }   
}
export default connectDatabase; */
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
const connectDatabase = async () => {

    try {
        await pool.query('SELECT 1');
        console.log("PostgreSQL database connected successfully");
        
    } catch (err) {
        console.log("Error connecting to PostgreSQL database", err);
        process.exit(1); // Exit the process in case of error
    }

    // Optionally return the client if you need to query later
    return pool;
};
export {pool};
export default connectDatabase;
import mongoose from "mongoose";
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
export default connectDatabase;
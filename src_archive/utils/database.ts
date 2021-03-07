import mongoose, { Mongoose, Schema } from "mongoose";
import { Community } from "../types/database"

export let CommunitySchema:Schema = new mongoose.Schema({
    id: Number,
    name: String,
    info: String,
})
// console.log(CommunitySchema)

export default async function connect(): Promise<Mongoose> {
    await mongoose.connect('mongodb://localhost:27017/test', {
        useNewUrlParser: true // Boilerplate for Mongoose 5.x
    });
    return mongoose;
}
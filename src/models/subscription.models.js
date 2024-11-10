import mongoose from "mongoose"
import { User } from "./user.models"


const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,      //One who is subscribing
        ref: "User"
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,      //One to whom 'subscriber' is subscribed to
        ref: "User"
    }
}, {timestamps:true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)
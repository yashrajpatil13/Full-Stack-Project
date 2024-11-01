import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String, //cloudnary URL
        required: true,
    },
    coverImage: {
        type: String,
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,       // Challenge of comparison as password from user is alphanumersic and stored in db is encrypted string 
        required: [true, 'Password is required'],

    },
    refreshToken: {
        type: String,
        reuqired: true,
    },

}, {
    timestamps: true
})


// Arrow function is not used as callback as the current contect access is required and as encryptions consumes time of its a async call\
// Password encryption logic
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next()

    this.password = bcrypt.hash(this.password, 10)
    next()
})

// Custom methods 
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)  
}

userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        {
            _id: this.id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
            _id: this.id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)



/*
Project configs
Define schema
Defining any pre middleware
Writing custom methods for JWT token
*/



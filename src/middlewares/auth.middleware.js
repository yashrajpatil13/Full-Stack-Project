import { ApiErrors } from "../utils/apiErrors.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "")            // Optional chaining is done as for mobile applications cookies are not saved or cannot be used so token are send/saved in req header
    
        if (!token) {
            throw new ApiErrors(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            // TODO: discussion about frontend
            throw new ApiErrors(401, "Invalid access token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiErrors(401, error?.message || "Invalid access token")
    }

})
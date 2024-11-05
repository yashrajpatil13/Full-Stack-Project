import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiErrors } from "../utils/apiErrors.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middelware.js"
import { ApiResponse } from "../utils/apiResponse.js"



const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar check
    // create user object - create entry in db
    // check for user creation
    // remove password and refresh token field from response
    // return response

    // Any data coming from form or json can be accessed using request
    const {fullname, email, username, password} = req.body
    console.log(`Request body: `, req.body)

    const emailPattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/

    // Check if any field is empty and is in pattern
    if( [fullname, email, username, password].some((field) => field?.trim() === "") )
    {
        throw new ApiErrors(400, "All fiels are required")
    }
    if ( !emailPattern.test(email) )
    {
        throw new ApiErrors(400, "Enter a valid email")
    }
    if ( !passwordPattern.test(password) )
    {
        throw new ApiErrors(400, "Enter a valid password")
    }

    // findOne is a mongoose Query (Format: Model.query()). Returns a Query obj.
    // $or: It’s useful when you want to check multiple fields and need to know if at least one of them matches.
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser) {
        throw new ApiErrors(409, "User already exists!")
    }

    const avatarLocaPath = req.files?.avatar[0]?.path  // Files access is given by multer, and the path can be accessed by uploaded files first property
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocaPath) {
        throw new ApiErrors(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocaPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiErrors(500, "Could not upload avatar on the cloudinary:[")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        email,
        username: username.toLowerCase(),
        coverImage: coverImage?.url || "",
        password: password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiErrors(500, "Something went wrong while registering the user")
    }

    // return res.status(201).json({createdUser})    Works fine as well

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully:]")
    )


})

export {registerUser}
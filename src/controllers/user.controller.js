import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiErrors } from "../utils/apiErrors.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middelware.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"

const emailPattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        // While saving the mongoose models kicks in so above oject is passed to save method to prevent unnecessary validation in this case

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiErrors(500, "Something went wrong while generating refresh and access token.")
    }
}

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
    const { fullname, email, username, password } = req.body


    // Check if any field is empty and is in pattern
    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiErrors(400, "All fields are required")
    }
    if (!emailPattern.test(email)) {
        throw new ApiErrors(400, "Enter a valid email")
    }
    if (!passwordPattern.test(password)) {
        throw new ApiErrors(400, "Enter a strong password")
    }

    // findOne is a mongoose Query (Format: Model.query()). Returns a Query obj.
    // $or: It’s useful when you want to check multiple fields and need to know if at least one of them matches.
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiErrors(409, "User already exists!")
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path  // Files access is given by multer, and the path can be accessed by uploaded files first property
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath = ""
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
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

    if (!createdUser) {
        throw new ApiErrors(500, "Something went wrong while registering the user")
    }

    // return res.status(201).json({createdUser})    Works fine as well

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully:]")
    )


})

const loginUser = asyncHandler(async (req, res) => {
    // req body => data
    // usernmae or password
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiErrors(400, "username or email and password is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiErrors(404, "User does not exist!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiErrors(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged In successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
        // Takes id and an obj with desired updates. This obj cointaines a mongodb operator the takes an object cointaining values to update and new values 
    )                                                   // To avoid querying a user, holdind it in a var then updating it and then saving it with validateBeforeSave we use above method

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {}, "User logged out") )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if(!incomingRefreshToken) {
            throw new ApiErrors(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if(!user) {
            throw new ApiErrors(401, "Invalid refresh token")
        }

        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiErrors(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {refreshToken, accessToken}, "Access token refreshed")
        )

    } catch (error) {
        console.log(error.statusCode, error.message)
        throw error
    }
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}
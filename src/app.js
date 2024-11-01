import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"   // For CRUD of secure cookies on users browser

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// .use used for config and setting middleware
app.use(express.json({limit: "16kb"}))   // here express is configured to make limit to json data input upto 16 kb per request
app.use(express.urlencoded({extended: true, limit: "16kb"}))  // For express to understand different configurations of URL
app.use(express.static("public"))  // for assets like image, favicons that are stored on the server
app.use(cookieParser())

// routes import
import  userRouter from "./routes/user.routes.js"




// routes declaration
app.use("/api/v1/users", userRouter)


export { app }
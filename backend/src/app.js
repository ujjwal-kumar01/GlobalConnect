import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js"; 
import userRoutes from "./routes/user.route.js"
import collegeRouter from './routes/college.route.js'
import studentRouter from './routes/student.route.js'
import jobRouter from './routes/jobs.route.js'
import adminRouter from './routes/admin.route.js'
import messageRouter from './routes/message.route.js' // 🔥 Add your new message router
import dashboarRouter from './routes/dashboard.route.js'

// 🔥 IMPORT 'app' FROM YOUR SOCKET FILE INSTEAD OF CREATING IT HERE
import { app } from "./socket/socket.js"; 

// Remove this line: const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("hello sir");
});

app.use('/api/user',userRoutes);
app.use('/api/colleges',collegeRouter);
app.use('/api/student',studentRouter);
app.use('/api/jobs',jobRouter);
app.use('/api/admin',adminRouter);
app.use('/api/dashboard',dashboarRouter);

// 🔥 Attach the message routes
app.use('/api/messages', messageRouter); 

app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: []
  });
});

export default app;
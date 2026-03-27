import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js"
import collegeRouter from './routes/college.route.js'
import studentRouter from './routes/student.route.js'

const app = express();

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


export default app;
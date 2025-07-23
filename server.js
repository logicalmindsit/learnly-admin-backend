import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/DB/db.js";
import { verifyToken } from "./src/Middleware/authMiddleware.js";

//Routs imports
import Login from "./src/Routes/Admin/loginRoutes.js";

//courses
import Course from "./src/Routes/Courses/courseroutes.js";
import Exam from "./src/Routes/Courses/ExamQuestionRoutes.js";
import UserExamAnswerRoutes from "./src/Routes/Courses/UserExamAnswerRoutes.js";

//Data Maintenance
import DirectMeetStudyMaterial from "./src/Routes/Data-maintenance/direct-meet-study-material-routes.js";
import DirectMeet from "./src/Routes/Data-maintenance/DirectMeetRoutes.js";
import ExamMarkRecords from "./src/Routes/Data-maintenance/exam-mark-records-routes.js";
import MonthlyFees from "./src/Routes/Data-maintenance/monthly-fees-routes.js";
import StaffDetails from "./src/Routes/Data-maintenance/staff-details-routes.js";
import StudentComplaintRecords from "./src/Routes/Data-maintenance/sudent-complain-records-routes.js";

//user info
// import StudentInfo from "./src/Routes/User/student-info.js";
import userRoutes from "./src/Routes/User/User-routes.js";

//Payment
import PaymentRoutes from "./src/Routes/Payment/payment-routes.js";
import EMIPlanRoutes from "./src/Routes/Payment/Emi-routes.js";

//BOS
import bosMeetingRoutes from "./src/Routes/BOS/bos-meetingRoutes.js";
import bosCourseProposalRoutes from "./src/Routes/BOS/bos-CourseproposalRoutes.js";
import recentDecisionRoutes from "./src/Routes/BOS/recentDecisionRoutes.js";
import bosmom from "./src/Routes/BOS/bos-momRoutes.js";
import bosTaskRoutes from "./src/Routes/BOS/bos-taskRoutes.js";
import bosVotingRoutes from "./src/Routes/BOS/bos-votingRoutes.js";

// DirectMeet Management
import DirectMeetRoutes from "./src/Routes/DirectMeet/DirectMeetRoutes.js";

// Notification
import notificationRoutes from "./src/Notification/routes.js";

// Voting Scheduler
import { startPollStatusScheduler, startDeadlineChecker } from "./src/Utils/voting-scheduler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(verifyToken);


//Routes

//login
app.use("/", Login);

//Courses
app.use("/", Course);
app.use("/", Exam);
app.use("/", UserExamAnswerRoutes);

//Data Maintenance
app.use("/", DirectMeetStudyMaterial);
app.use("/", DirectMeet);
app.use("/", ExamMarkRecords);
app.use("/", MonthlyFees);
app.use("/", StaffDetails);
app.use("/", StudentComplaintRecords);

//User Info
// app.use("/", StudentInfo);
app.use("/", userRoutes);

//Payment
app.use("/", PaymentRoutes);
app.use("/", EMIPlanRoutes);

//BOS
app.use("/", bosMeetingRoutes);
app.use("/", bosCourseProposalRoutes);
app.use("/", recentDecisionRoutes);
app.use("/", bosmom);
app.use("/", bosTaskRoutes);
app.use("/", bosVotingRoutes);

// DirectMeet Management
app.use("/", DirectMeetRoutes);

// Notification
app.use("/", notificationRoutes);



// Create HTTP server and setup Socket.IO
import http from "http";
import { Server as SocketIOServer } from "socket.io";

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Example Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

server.listen(PORT, async () => {
  await connectDB();
  
  // Start voting system schedulers
  startPollStatusScheduler();
  startDeadlineChecker();
  
  console.log(`Server (with Socket.IO) is running on http://localhost:${PORT}`);
});

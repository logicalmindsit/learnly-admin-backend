import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/DB/db.js";
import { verifyToken } from "./src/Middleware/authMiddleware.js";

//Routs imports
import Login from "./src/Routes/Admin/loginRoutes.js";

// Admin 
import AdminRoutes from "./src/Routes/Admin/AdminRoutes.js";

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

// Voting Scheduler
import { startPollStatusScheduler, startDeadlineChecker } from "./src/Utils/voting-scheduler.js";
// Announcement
import announcementRoutes from './src/Routes/Announcement/AnnouncementRoutes.js';
// Advertisement 
import advertisementRoutes from './src/Routes/Advertisement/AdvertisementRoutes.js';

// Notification
import notificationRoutes from "./src/Routes/Notification-Routes/routes.js";

//notification bell
import notificationBellRoutes from './src/Routes/NotificationBell/NotificationBellRoutes.js';
import joinRequestRoutes from './src/Routes/NotificationBell/joinRequestRoutes.js';
import materialRoutes from './src/Routes/NotificationBell/materialRoutes.js';

// Tutor Management
import tutorRoutes from './src/Routes/Tutor/Tutor-Routes.js';
import courseRoutes from './src/Routes/Tutor/Tutor-course-routes.js';


// PCM routes for managing PCM-class meetings
import pcmRoutes from "./src/Routes/Student-PCM/pcmRoutes.js";

// Blog Management
import blogRoutes from "./src/Routes/Blog/blogRoutes.js";

//Event Management
import eventManageRoutes from "./src/Routes/Event-Manage-Routes/event-manage-routes.js";

// Financial Management
import donationRoutes from "./src/Routes/Financial/DonationRoutes.js";
import expenseRoutes from "./src/Routes/Financial/ExpenseRoutes.js";

import path from 'path';
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use((req,res,next) => {next();});
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use(express.static('public'));

// Public Routes (before authentication middleware)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Blog Management (public routes first)
app.use('/api/blog', blogRoutes);

// Apply authentication middleware for protected routes
app.use(verifyToken);


//Routes

//Admin Login and Auth
app.use("/", Login);

//Admin Management
app.use("/", AdminRoutes);

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

// create Tutor 
app.use("/", tutorRoutes);

// PCM class routes 
app.use('/', pcmRoutes);

// Tutor routes
app.use("/", tutorRoutes);
app.use("/", courseRoutes);


// Notification
app.use("/", notificationRoutes);
app.use('/api/bell-notifications', notificationBellRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// matra app.use() lines
app.use('/api/materials', materialRoutes);

// Announcement and Advertisement
app.use('/api/announcements', announcementRoutes);
app.use('/api/advertisements', advertisementRoutes);


// Event Management
app.use("/", eventManageRoutes); 

// Financial Management
app.use("/api", donationRoutes);
app.use("/api", expenseRoutes);

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
  
  console.log(`Server run with Socket.IO http://localhost:${PORT}`);
});

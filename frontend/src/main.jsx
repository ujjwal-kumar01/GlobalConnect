import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {
  createRoutesFromElements,
  Route,
  RouterProvider,
  createBrowserRouter
} from 'react-router-dom'

// Pages
import Home from './pages/Home.jsx'
import LoginPage from './pages/Auth/LoginPage.jsx'
import RegisterPage from './pages/Auth/RegisterPage.jsx'
import VerifyEmailPage from './pages/Auth/VerifyEmailPage.jsx'
import UserProfile from './pages/UserProfile.jsx'

// Onboarding
import OnboardingLayout from './components/layout/OnboardingLayout.jsx'
import Onboarding from './pages/Onboarding/Onboarding.jsx'
import OnboardingStudent from './pages/Onboarding/OnboardingStudent.jsx'
import OnboardingAdmin from './pages/Onboarding/OnboardingAdmin.jsx'
import OnboardingRecruiter from './pages/Onboarding/OnboardingRecruiter.jsx'

// Unified Layout & Auth Guard
import ContentLayout from './components/layout/ContentLayout.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'

// Feature Pages
import Dashboard from './pages/Student/Dashboard.jsx' 
import Alumni from './pages/Student/Alumni.jsx'
import Jobs from './pages/Student/Jobs.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { UserProvider } from './context/UserContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import JoinCollege from './pages/Recruiter/JoinCollege.jsx'
import PostJob from './pages/Recruiter/PostJob.jsx'
import RecruiterManagement from './pages/CollegeAdmin/RecruiterManagement.jsx'
import AdminManagement from './pages/CollegeAdmin/AdminManagement.jsx'
import MemberManagement from './pages/CollegeAdmin/StudentManagement.jsx'
import JobApplicants from './pages/Recruiter/JobApplicants.jsx'
import StudentApplications from './pages/Student/AppliedApplications.jsx'
import Messages from './pages/Messages.jsx'
import CampusChat from './pages/CampusChat.jsx'
import AdminDashboard from './pages/CollegeAdmin/AdminDashboard.jsx'
import RecruiterDashboard from './pages/Recruiter/RecruiterDashboard.jsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<App />} >
      
      {/* 🟢 Public Routes */}
      <Route index element={<Home />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="verify" element={<VerifyEmailPage />} />
      
      {/* 🟡 Onboarding Routes */}
      <Route path="onboarding" element={<OnboardingLayout />}>
        <Route index element={<Onboarding />} />
        <Route path="student" element={<OnboardingStudent />} />
        <Route path="admin" element={<OnboardingAdmin />} />
        <Route path="recruiter" element={<OnboardingRecruiter />} />
      </Route>

      {/* 🔴 PROTECTED UNIFIED LAYOUT ROUTING --- */}

      {/* 🟣 Shared Portal - Auth Guard */}
      <Route element={<ProtectedRoute allowedRoles={['student', 'alumni', 'recruiter', 'admin', 'super_admin']} />}>
        
        {/* The logged-in user's own settings/profile */}
        <Route path="account" element={<ContentLayout />} >
          <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* Dynamic route to view ANY user's profile based on their ID */}
        <Route path="profile" element={<ContentLayout />} >
          <Route path=":userId" element={<UserProfile />} />
        </Route>

        {/* 🔥 UPDATED: Messages restricted to only Students and Alumni */}
        <Route element={<ProtectedRoute allowedRoles={['student', 'alumni','recruiter']} />}>
          <Route path="messages" element={<ContentLayout />}>
            <Route index element={<Messages />} />
          </Route>
        </Route>
        
      </Route>
      
      {/* 🔵 Student/Alumni Portal - Base */}
      <Route element={<ProtectedRoute allowedRoles={['student', 'alumni']} />}>
        <Route path="student" element={<ContentLayout />} >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="alumni" element={<Alumni />} />
          <Route path="campus-feed" element={<CampusChat />} />
          
          {/* STUDENTS ONLY */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="jobs" element={<Jobs />} />
            <Route path="MyApplications" element={<StudentApplications />} />
          </Route>

          {/* ALUMNI ONLY */}
          <Route element={<ProtectedRoute allowedRoles={['alumni']} />}>
            <Route path="post-jobs" element={<PostJob />} />
            <Route path="JobApplicants" element={<JobApplicants />} />
          </Route>
        </Route>
      </Route>

      {/* 🏢 Recruiter Portal */}
      <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
        <Route path="recruiter" element={<ContentLayout />} >
          <Route path="dashboard" element={<RecruiterDashboard />} /> 
          <Route path="JobApplicants" element={<JobApplicants />} />
          <Route path="post-jobs" element={<PostJob />} />
          <Route path="join-college" element={<JoinCollege />} />
        </Route>
      </Route>

      {/* 🛡️ Admin Portal */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
        <Route path="admin" element={<ContentLayout />} >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="RecruiterManagement" element={<RecruiterManagement />} />
          <Route path="MemberManagement" element={<MemberManagement />} />
          
          {/* SUPER ADMIN ONLY */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="manage-admins" element={<AdminManagement />} />
          </Route>
        </Route>
      </Route>

    </Route>
  )
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <UserProvider>
        <SocketProvider>
        <RouterProvider router={router} />
        </SocketProvider>
      </UserProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
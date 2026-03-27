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

// Onboarding
import OnboardingLayout from './components/layout/OnboardingLayout.jsx'
import Onboarding from './pages/Onboarding/Onboarding.jsx'
import OnboardingStudent from './pages/Onboarding/OnboardingStudent.jsx'
import OnboardingAdmin from './pages/Onboarding/OnboardingAdmin.jsx'
import OnboardingRecruiter from './pages/Onboarding/OnboardingRecruiter.jsx'

// Unified Layout & Auth Guard
import ContentLayout from './components/layout/ContentLayout.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx' // 🔥 Imported the Guard here

// Feature Pages
import Dashboard from './pages/Student/Dashboard.jsx' 
import Alumni from './pages/Student/Alumni.jsx'
import Jobs from './pages/Student/Jobs.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { UserProvider } from './context/UserContext.jsx';

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
      
      {/* Student/Alumni Portal - Locked to students & alumni */}
      <Route element={<ProtectedRoute allowedRoles={['student', 'alumni']} />}>
        <Route path="student" element={<ContentLayout />} >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="alumni" element={<Alumni />} />
        </Route>
      </Route>

      {/* Recruiter Portal - Locked to recruiters */}
      <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
        <Route path="recruiter" element={<ContentLayout />} >
          {/* You can point this to a Recruiter-specific dashboard component later */}
          <Route path="dashboard" element={<Dashboard />} /> 
          
          {/* Uncomment these as you build the components! */}
          {/* <Route path='messages' element={<Messages/>}/> */}
          {/* <Route path='post-jobs' element={<PostJobs/>}/> */}
          {/* <Route path='join-college' element={<JoinCollege/>}/> */}
        </Route>
      </Route>

      {/* Admin Portal - Locked to admins & super_admins */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
        <Route path="admin" element={<ContentLayout />} >
          {/* You can point this to an Admin-specific dashboard component later */}
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Route>

    </Route>
  )
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
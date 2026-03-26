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
import Home from './pages/Home.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Dashboard from './pages/Student/Dashboard.jsx'
import ContentLayout from './pages/Student/ContentLayout.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import { UserProvider } from './context/UserContext.jsx';
import Onboarding from './pages/Onboarding.jsx'
import OnboardingStudent from './pages/Student/OnboardingStudent.jsx'
import OnboardingAdmin from './pages/CollegeAdmin/OnboardingAdmin.jsx'
import OnboardingRecruiter from './pages/Recruiter/OnboardingRecruiter.jsx'
import OnboardingLayout from './pages/OnboardingLayout.jsx'
import Alumni from './pages/Student/Alumni.jsx'
import Jobs from './pages/Student/Jobs.jsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<App />} >
      <Route index element={<Home />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="verify" element={<VerifyEmailPage />} />
      <Route path="/onboarding" element={<OnboardingLayout />}>
        <Route index element={<Onboarding />} />
        <Route path="student" element={<OnboardingStudent />} />
        <Route path="admin" element={<OnboardingAdmin />} />
        <Route path="recruiter" element={<OnboardingRecruiter />} />
      </Route>
      <Route path="student" element={<ContentLayout />} >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="alumni" element={<Alumni />} />
      </Route>
      <Route path="recruiter" element={<ContentLayout />} >
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
      <Route path="admin" element={<ContentLayout />} >
        <Route path="dashboard" element={<Dashboard />} />
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

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
import Dashboard from './pages/StudentContent/Dashboard.jsx'
import ContentLayout from './pages/ContentLayout.jsx'
import { UserProvider } from './context/UserContext.jsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<App />} >
      <Route index element={<Home />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="u" element={<ContentLayout />} >
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

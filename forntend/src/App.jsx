import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Auth Pages
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import VerifyOTP from './pages/VerifyOTP'
import BusinessSetup from './pages/BusinessSetup'

// Main Pages
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import LeadDetails from './pages/LeadDetails'
import Clients from './pages/Clients'
import ClientDetails from './pages/ClientDetails'
import CreateClient from './pages/CreateClient'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import InvoiceDetails from './pages/InvoiceDetails'
import Invoices from './pages/Invoices'
import CreateInvoice from './pages/CreateInvoice'
import SocialMedia from './pages/SocialMedia'
import CreateSocialPost from './pages/CreateSocialPost'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-black">
          <Routes>
            {/* Public Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/business-setup" element={<BusinessSetup />} />

            {/* Protected Routes with Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/leads" element={
              <ProtectedRoute>
                <Layout>
                  <Leads />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/leads/:id" element={
              <ProtectedRoute>
                <Layout>
                  <LeadDetails />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/clients" element={
              <ProtectedRoute>
                <Layout>
                  <Clients />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/clients/new" element={
              <ProtectedRoute>
                <Layout>
                  <CreateClient />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/clients/:id" element={
              <ProtectedRoute>
                <Layout>
                  <ClientDetails />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/invoices" element={
              <ProtectedRoute>
                <Layout>
                  <Invoices />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/invoices/new" element={
              <ProtectedRoute>
                <Layout>
                  <CreateInvoice />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/invoices/:id" element={
              <ProtectedRoute>
                <Layout>
                  <InvoiceDetails />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/social-media" element={
              <ProtectedRoute>
                <Layout>
                  <SocialMedia />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/social-media/new" element={
              <ProtectedRoute>
                <Layout>
                  <CreateSocialPost />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f87171',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App 
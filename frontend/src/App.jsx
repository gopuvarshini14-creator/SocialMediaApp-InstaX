import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Navbar from './components/Navbar';
import './styles/global.css';

// Loading Component with InstaX Branding
const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="instax-loading">
        <div className="loading-logo">
          <div className="logo-animation">
            <div className="camera-icon"></div>
            <span className="logo-text">Insta<span className="logo-x">X</span></span>
          </div>
        </div>
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your InstaX experience...</p>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <div className="app">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes with New Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <Explore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreatePost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create/story"
              element={
                <ProtectedRoute>
                  <div className="create-story-page">
                    <h1>Create Story</h1>
                    <p>Story feature coming soon!</p>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create/reel"
              element={
                <ProtectedRoute>
                  <div className="create-reel-page">
                    <h1>Create Reel</h1>
                    <p>Reel feature coming soon!</p>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <div className="settings-page">
                    <h1>Settings</h1>
                    <p>Settings page coming soon!</p>
                  </div>
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
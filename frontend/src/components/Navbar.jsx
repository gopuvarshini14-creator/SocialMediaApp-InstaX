import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHome, FaSearch, FaPlusCircle, FaUser, FaSignOutAlt, FaEnvelope, FaBell, FaInstagram, FaCamera, FaCog } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const userMenuRef = useRef(null);
    const createMenuRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            fetchNotificationCount();
            const interval = setInterval(() => {
                fetchUnreadCount();
                fetchNotificationCount();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (createMenuRef.current && !createMenuRef.current.contains(event.target)) {
                setShowCreateMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                'http://localhost:5000/api/messages/unread-count',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchNotificationCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                'http://localhost:5000/api/notifications/unread-count',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotificationCount(data.count);
        } catch (error) {
            console.error('Error fetching notification count:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="instax-navbar">
            {/* Logo Section */}
            <div className="nav-left">
                <Link to="/" className="nav-logo">
                    <div className="instax-logo">
                        <FaCamera className="logo-icon" />
                        <span className="logo-text">Insta<span className="logo-x">X</span></span>
                    </div>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="nav-center">
                <div className="search-container">
                    <FaSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search on InstaX..." 
                        className="search-input"
                    />
                </div>
            </div>

            {/* Navigation Icons */}
            <div className="nav-right">
                <Link to="/" className="nav-icon-link">
                    <FaHome className="nav-icon" />
                    <span className="nav-tooltip">Home</span>
                </Link>

                <Link to="/explore" className="nav-icon-link">
                    <FaSearch className="nav-icon" />
                    <span className="nav-tooltip">Explore</span>
                </Link>

                {/* Create Post Dropdown */}
                <div className="nav-icon-link create-dropdown" ref={createMenuRef}>
                    <button 
                        className="create-button"
                        onClick={() => setShowCreateMenu(!showCreateMenu)}
                    >
                        <FaPlusCircle className="nav-icon create-icon" />
                        <span className="nav-tooltip">Create</span>
                    </button>
                    
                    {showCreateMenu && (
                        <div className="create-dropdown-menu">
                            <Link to="/create" className="dropdown-item">
                                <FaPlusCircle />
                                <span>Create Post</span>
                            </Link>
                            <Link to="/create/story" className="dropdown-item">
                                <FaInstagram />
                                <span>Create Story</span>
                            </Link>
                            <Link to="/create/reel" className="dropdown-item">
                                <FaCamera />
                                <span>Create Reel</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <Link to="/notifications" className="nav-icon-link" onClick={() => setNotificationCount(0)}>
                    <div className="nav-icon-wrapper">
                        <FaBell className="nav-icon" />
                        {notificationCount > 0 && (
                            <span className="nav-badge">
                                {notificationCount > 99 ? '99+' : notificationCount}
                            </span>
                        )}
                    </div>
                    <span className="nav-tooltip">Notifications</span>
                </Link>

                {/* Messages */}
                <Link to="/messages" className="nav-icon-link" onClick={() => setUnreadCount(0)}>
                    <div className="nav-icon-wrapper">
                        <FaEnvelope className="nav-icon" />
                        {unreadCount > 0 && (
                            <span className="nav-badge">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <span className="nav-tooltip">Messages</span>
                </Link>

                {/* Profile Dropdown */}
                <div className="profile-dropdown" ref={userMenuRef}>
                    <button 
                        className="profile-button"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="profile-avatar"
                            />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                <FaUser />
                            </div>
                        )}
                    </button>
                    
                    {showUserMenu && (
                        <div className="profile-dropdown-menu">
                            <div className="dropdown-header">
                                <div className="dropdown-avatar">
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.username} />
                                    ) : (
                                        <FaUser />
                                    )}
                                </div>
                                <div className="dropdown-user-info">
                                    <strong>{user?.username || 'User'}</strong>
                                    <span>{user?.email || ''}</span>
                                </div>
                            </div>
                            
                            <div className="dropdown-divider"></div>
                            
                            <Link 
                                to="/profile" 
                                className="dropdown-item"
                                onClick={() => setShowUserMenu(false)}
                            >
                                <FaUser />
                                <span>Profile</span>
                            </Link>
                            
                            <Link 
                                to="/settings" 
                                className="dropdown-item"
                                onClick={() => setShowUserMenu(false)}
                            >
                                <FaCog />
                                <span>Settings</span>
                            </Link>
                            
                            <div className="dropdown-divider"></div>
                            
                            <button
                                onClick={handleLogout}
                                className="dropdown-item logout-item"
                            >
                                <FaSignOutAlt />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
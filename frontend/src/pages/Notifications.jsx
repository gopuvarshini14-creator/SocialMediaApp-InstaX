import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    FaHeart, 
    FaComment, 
    FaUserPlus, 
    FaBell, 
    FaCheck, 
    FaTrash,
    FaEllipsisH,
    FaShare,
    FaBookmark,
    FaRetweet,
    FaStar,
    FaCrown,
    FaImage,
    FaVideo,
    FaCheckCircle
} from 'react-icons/fa';
import '../styles/Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, [filter]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                `http://localhost:5000/api/notifications?filter=${filter}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                'http://localhost:5000/api/notifications/unread-count',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(0);
            fetchNotifications(); // Refresh to update read status
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` } 
            });
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read when clicked
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // Navigate based on notification type
        switch (notification.type) {
            case 'follow':
                navigate(`/profile/${notification.related_user_id}`);
                break;
            case 'like':
            case 'comment':
            case 'mention':
                if (notification.post_id) {
                    // If you have a post detail page
                    // navigate(`/post/${notification.post_id}`);
                    // For now, navigate to profile
                    navigate(`/profile/${notification.related_user_id}`);
                } else {
                    navigate(`/profile/${notification.related_user_id}`);
                }
                break;
            default:
                navigate(`/profile/${notification.related_user_id}`);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like':
                return <FaHeart className="notification-icon like" />;
            case 'comment':
                return <FaComment className="notification-icon comment" />;
            case 'follow':
                return <FaUserPlus className="notification-icon follow" />;
            case 'mention':
                return <FaShare className="notification-icon mention" />;
            case 'share':
                return <FaRetweet className="notification-icon share" />;
            case 'save':
                return <FaBookmark className="notification-icon save" />;
            default:
                return <FaBell className="notification-icon default" />;
        }
    };

    const getNotificationText = (notification) => {
        switch (notification.type) {
            case 'like':
                return `${notification.username} liked your post`;
            case 'comment':
                return `${notification.username} commented on your post`;
            case 'follow':
                return `${notification.username} started following you`;
            case 'mention':
                return `${notification.username} mentioned you in a post`;
            case 'share':
                return `${notification.username} shared your post`;
            case 'save':
                return `${notification.username} saved your post`;
            default:
                return notification.message || 'New notification';
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notification.is_read;
        return notification.type === filter;
    });

    if (loading) {
        return (
            <div className="notifications-loading">
                <div className="loading-skeleton">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="notification-skeleton">
                            <div className="skeleton-avatar"></div>
                            <div className="skeleton-content">
                                <div className="skeleton-line short"></div>
                                <div className="skeleton-line long"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="instax-notifications">
            {/* Header */}
            <div className="notifications-header">
                <div className="header-left">
                    <div className="header-title">
                        <FaBell className="header-icon" />
                        <h1>Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="unread-badge-header">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <p className="header-subtitle">
                        Stay updated with your account activity
                    </p>
                </div>
                <div className="header-actions">
                    <button 
                        className="mark-all-read-btn"
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                    >
                        <FaCheckCircle />
                        Mark all as read
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="notifications-filters">
                <button 
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button 
                    className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Unread
                    {unreadCount > 0 && (
                        <span className="filter-badge">{unreadCount}</span>
                    )}
                </button>
                <button 
                    className={`filter-tab ${filter === 'follow' ? 'active' : ''}`}
                    onClick={() => setFilter('follow')}
                >
                    <FaUserPlus />
                    Follows
                </button>
                <button 
                    className={`filter-tab ${filter === 'like' ? 'active' : ''}`}
                    onClick={() => setFilter('like')}
                >
                    <FaHeart />
                    Likes
                </button>
                <button 
                    className={`filter-tab ${filter === 'comment' ? 'active' : ''}`}
                    onClick={() => setFilter('comment')}
                >
                    <FaComment />
                    Comments
                </button>
            </div>

            {/* Notifications List */}
            <div className="notifications-container">
                {filteredNotifications.length === 0 ? (
                    <div className="empty-notifications">
                        <div className="empty-icon">
                            <FaBell />
                        </div>
                        <h3>No Notifications</h3>
                        <p>
                            {filter === 'all' 
                                ? "You're all caught up! When you have new notifications, they'll appear here."
                                : `No ${filter} notifications yet.`}
                        </p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setFilter('all')}
                        >
                            View All Notifications
                        </button>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="notification-icon-container">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                
                                <div className="notification-content">
                                    <div className="notification-main">
                                        <div className="notification-text">
                                            {getNotificationText(notification)}
                                        </div>
                                        <span className="notification-time">
                                            {formatTime(notification.created_at)}
                                        </span>
                                    </div>
                                    
                                    {notification.post_preview && (
                                        <div className="notification-preview">
                                            <p className="preview-text">
                                                {notification.post_preview}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="notification-right">
                                    {notification.post_image && (
                                        <div className="notification-image">
                                            <img 
                                                src={notification.post_image} 
                                                alt="Post preview"
                                            />
                                            {notification.media_type === 'video' && (
                                                <div className="media-type-badge">
                                                    <FaVideo />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="notification-actions">
                                        <button 
                                            className="action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedNotification(
                                                    selectedNotification?.id === notification.id ? null : notification.id
                                                );
                                            }}
                                        >
                                            <FaEllipsisH />
                                        </button>
                                        
                                        {selectedNotification === notification.id && (
                                            <div className="notification-dropdown">
                                                {!notification.is_read && (
                                                    <button 
                                                        className="dropdown-item"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(notification.id);
                                                            setSelectedNotification(null);
                                                        }}
                                                    >
                                                        <FaCheck />
                                                        Mark as read
                                                    </button>
                                                )}
                                                <button 
                                                    className="dropdown-item delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Delete this notification?')) {
                                                            deleteNotification(notification.id);
                                                        }
                                                        setSelectedNotification(null);
                                                    }}
                                                >
                                                    <FaTrash />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!notification.is_read && (
                                    <div className="unread-indicator"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Stats Summary */}
            <div className="notifications-stats">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <FaBell />
                    </div>
                    <div className="stat-info">
                        <span className="stat-number">{notifications.length}</span>
                        <span className="stat-label">Total</span>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon unread-stat">
                        <FaStar />
                    </div>
                    <div className="stat-info">
                        <span className="stat-number">{unreadCount}</span>
                        <span className="stat-label">Unread</span>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon today">
                        <FaCrown />
                    </div>
                    <div className="stat-info">
                        <span className="stat-number">
                            {notifications.filter(n => {
                                const today = new Date().toDateString();
                                return new Date(n.created_at).toDateString() === today;
                            }).length}
                        </span>
                        <span className="stat-label">Today</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
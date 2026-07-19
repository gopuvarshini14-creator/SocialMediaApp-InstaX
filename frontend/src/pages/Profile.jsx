import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    FaCamera, 
    FaEdit, 
    FaEllipsisH, 
    FaUserPlus, 
    FaUserCheck, 
    FaGlobe, 
    FaLink, 
    FaCalendar,
    FaMapMarkerAlt,
    FaBookmark,
    FaThLarge as FaGrid,  // Changed this line
    FaVideo,
    FaTag,
    FaCog
} from 'react-icons/fa';
import PostModal from '../components/PostModal';
import '../styles/Profile.css';

const Profile = () => {
    const { user, setUser } = useAuth();
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [activeTab, setActiveTab] = useState('posts');
    const [showMenu, setShowMenu] = useState(false);
    const [followStats, setFollowStats] = useState({
        followerCount: 0,
        followingCount: 0,
        isFollowing: false
    });

    const isOwnProfile = !userId || (user && user.id === parseInt(userId));
    const displayUser = isOwnProfile ? user : profileUser;

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem('token');
                const targetUserId = userId || user?.id;

                if (!targetUserId) return;

                // Fetch user posts
                const { data: postsData } = await axios.get(
                    `http://localhost:5000/api/posts/user/${targetUserId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setPosts(postsData);

                // Fetch follow stats
                const { data: statsData } = await axios.get(
                    `http://localhost:5000/api/users/${targetUserId}/stats`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setFollowStats(statsData);

                // If viewing another user's profile, fetch their info
                if (!isOwnProfile) {
                    const { data: userData } = await axios.get(
                        `http://localhost:5000/api/auth/user/${targetUserId}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setProfileUser(userData);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchProfileData();
    }, [user, userId, isOwnProfile]);

    const handleFollow = async () => {
        try {
            const token = localStorage.getItem('token');
            const targetUserId = userId || user?.id;

            if (followStats.isFollowing) {
                // Unfollow
                const { data } = await axios.delete(
                    `http://localhost:5000/api/users/${targetUserId}/follow`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setFollowStats(prev => ({
                    ...prev,
                    followerCount: data.followerCount,
                    isFollowing: false
                }));
            } else {
                // Follow
                const { data } = await axios.post(
                    `http://localhost:5000/api/users/${targetUserId}/follow`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setFollowStats(prev => ({
                    ...prev,
                    followerCount: data.followerCount,
                    isFollowing: true
                }));
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            alert(error.response?.data?.message || 'Failed to update connection');
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                'http://localhost:5000/api/auth/profile-picture',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedUser = { ...user, avatar_url: data.avatar_url };
            setUser(updatedUser);
            alert('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to update profile picture');
        } finally {
            setUploading(false);
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (!user) {
        return (
            <div className="profile-loading">
                <div className="loading-message">
                    <FaCamera className="loading-icon" />
                    <p>Please log in to view profiles</p>
                    <button onClick={() => navigate('/login')} className="btn btn-primary">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="profile-skeleton">
                    <div className="skeleton-header">
                        <div className="skeleton-avatar"></div>
                        <div className="skeleton-info">
                            <div className="skeleton-line large"></div>
                            <div className="skeleton-line medium"></div>
                            <div className="skeleton-line small"></div>
                        </div>
                    </div>
                    <div className="skeleton-tabs"></div>
                    <div className="skeleton-grid">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="skeleton-post"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!displayUser) {
        return (
            <div className="profile-not-found">
                <FaCamera className="not-found-icon" />
                <h3>User Not Found</h3>
                <p>The profile you're looking for doesn't exist.</p>
                <button onClick={() => navigate('/')} className="btn btn-primary">
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="instax-profile">
            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-avatar-section">
                    <div className="avatar-container">
                        <img
                            src={displayUser.avatar_url || `https://picsum.photos/seed/${displayUser.id}/150`}
                            alt={displayUser.username}
                            className="profile-avatar"
                        />
                        {isOwnProfile && (
                            <label htmlFor="avatar-upload" className="avatar-upload-overlay">
                                {uploading ? (
                                    <div className="uploading-spinner"></div>
                                ) : (
                                    <>
                                        <FaCamera />
                                        <span>Change Photo</span>
                                    </>
                                )}
                            </label>
                        )}
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                            disabled={uploading}
                        />
                    </div>
                </div>

                <div className="profile-info-section">
                    <div className="profile-header-top">
                        <h1 className="profile-username">{displayUser.username}</h1>
                        <div className="profile-actions">
                            {isOwnProfile ? (
                                <>
                                    <button 
                                        className="btn btn-outline"
                                        onClick={() => navigate('/edit-profile')}
                                    >
                                        <FaEdit />
                                        Edit Profile
                                    </button>
                                    <button 
                                        className="btn btn-outline"
                                        onClick={() => setShowMenu(!showMenu)}
                                    >
                                        <FaCog />
                                        Settings
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className={`btn ${followStats.isFollowing ? 'btn-outline' : 'btn-primary'}`}
                                        onClick={handleFollow}
                                    >
                                        {followStats.isFollowing ? (
                                            <>
                                                <FaUserCheck />
                                                Following
                                            </>
                                        ) : (
                                            <>
                                                <FaUserPlus />
                                                Follow
                                            </>
                                        )}
                                    </button>
                                    <button className="btn btn-outline">
                                        Message
                                    </button>
                                    <button className="btn btn-text">
                                        <FaEllipsisH />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="profile-stats">
                        <div className="stat-item">
                            <strong>{formatNumber(posts.length)}</strong>
                            <span>Posts</span>
                        </div>
                        <div className="stat-item">
                            <strong>{formatNumber(followStats.followerCount)}</strong>
                            <span>Followers</span>
                        </div>
                        <div className="stat-item">
                            <strong>{formatNumber(followStats.followingCount)}</strong>
                            <span>Following</span>
                        </div>
                    </div>

                    <div className="profile-bio">
                        <h3>{displayUser.full_name || displayUser.username}</h3>
                        {displayUser.bio && <p className="bio-text">{displayUser.bio}</p>}
                        
                        <div className="profile-details">
                            {displayUser.website && (
                                <div className="detail-item">
                                    <FaLink />
                                    <a href={displayUser.website} target="_blank" rel="noopener noreferrer">
                                        {displayUser.website.replace('https://', '')}
                                    </a>
                                </div>
                            )}
                            {displayUser.location && (
                                <div className="detail-item">
                                    <FaMapMarkerAlt />
                                    <span>{displayUser.location}</span>
                                </div>
                            )}
                            {displayUser.joined_date && (
                                <div className="detail-item">
                                    <FaCalendar />
                                    <span>Joined {new Date(displayUser.joined_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="profile-navigation">
                <button 
                    className={`nav-tab ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    <FaGrid />
                    <span>Posts</span>
                </button>
                <button 
                    className={`nav-tab ${activeTab === 'reels' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reels')}
                >
                    <FaVideo />
                    <span>Reels</span>
                </button>
                <button 
                    className={`nav-tab ${activeTab === 'saved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('saved')}
                >
                    <FaBookmark />
                    <span>Saved</span>
                </button>
                <button 
                    className={`nav-tab ${activeTab === 'tagged' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tagged')}
                >
                    <FaTag />
                    <span>Tagged</span>
                </button>
            </div>

            {/* Posts Grid */}
            <div className="profile-content">
                {activeTab === 'posts' && (
                    <div className="posts-grid">
                        {posts.length === 0 ? (
                            <div className="empty-posts">
                                <FaCamera className="empty-icon" />
                                <h3>No Posts Yet</h3>
                                <p>{isOwnProfile ? 'Share your first moment!' : 'No posts to show'}</p>
                                {isOwnProfile && (
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => navigate('/create')}
                                    >
                                        Create First Post
                                    </button>
                                )}
                            </div>
                        ) : (
                            posts.map(post => (
                                <div
                                    key={post.id}
                                    className="profile-post-item"
                                    onClick={() => setSelectedPost(post)}
                                >
                                    <img 
                                        src={post.image_url || `https://picsum.photos/seed/${post.id}/300`} 
                                        alt={post.caption}
                                    />
                                    <div className="post-overlay">
                                        <div className="post-stats">
                                            <span>❤️ {formatNumber(post.like_count)}</span>
                                            <span>💬 {formatNumber(post.comment_count)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'reels' && (
                    <div className="reels-grid">
                        <div className="coming-soon">
                            <FaVideo className="coming-soon-icon" />
                            <h3>Reels Coming Soon</h3>
                            <p>Short video content feature is under development</p>
                        </div>
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div className="saved-grid">
                        <div className="coming-soon">
                            <FaBookmark className="coming-soon-icon" />
                            <h3>Saved Posts</h3>
                            <p>Your saved posts will appear here</p>
                        </div>
                    </div>
                )}

                {activeTab === 'tagged' && (
                    <div className="tagged-grid">
                        <div className="coming-soon">
                            <FaTag className="coming-soon-icon" />
                            <h3>Tagged Posts</h3>
                            <p>Posts you're tagged in will appear here</p>
                        </div>
                    </div>
                )}
            </div>

            {selectedPost && (
                <PostModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                />
            )}
        </div>
    );
};

export default Profile;
import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { FaHeart, FaRegHeart, FaPaperPlane, FaTrash, FaEllipsisH, FaBookmark, FaRegBookmark, FaShare, FaComment, FaUserPlus, FaUserCheck, FaCamera } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentInputs, setCommentInputs] = useState({});
    const [showComments, setShowComments] = useState({});
    const [comments, setComments] = useState({});
    const [followStatus, setFollowStatus] = useState({});
    const [savedPosts, setSavedPosts] = useState({});
    const [activePostMenu, setActivePostMenu] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/posts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPosts(data);

            // Fetch follow status for each unique user
            const uniqueUserIds = [...new Set(data.map(post => post.user_id))];
            uniqueUserIds.forEach(userId => {
                if (user && userId !== user.id) {
                    fetchFollowStatus(userId);
                }
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (postId, isLiked) => {
        try {
            const token = localStorage.getItem('token');
            let data;

            if (isLiked) {
                const response = await axios.delete(
                    `http://localhost:5000/api/posts/${postId}/like`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                data = response.data;
            } else {
                const response = await axios.post(
                    `http://localhost:5000/api/posts/${postId}/like`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                data = response.data;
            }

            setPosts(posts.map(post =>
                post.id === postId
                    ? { ...post, like_count: data.likeCount, liked_by_user: data.liked }
                    : post
            ));
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleSavePost = async (postId, isSaved) => {
        try {
            const token = localStorage.getItem('token');
            // This would call your backend save post API
            // For now, we'll just toggle the UI state
            setSavedPosts(prev => ({
                ...prev,
                [postId]: !isSaved
            }));
        } catch (error) {
            console.error('Error saving post:', error);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:5000/api/posts/${postId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPosts(posts.filter(post => post.id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        }
    };

    const fetchFollowStatus = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                `http://localhost:5000/api/users/${userId}/stats`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFollowStatus(prev => ({ ...prev, [userId]: data.isFollowing }));
        } catch (error) {
            console.error('Error fetching follow status:', error);
        }
    };

    const handleFollow = async (userId, currentlyFollowing) => {
        try {
            const token = localStorage.getItem('token');

            if (currentlyFollowing) {
                await axios.delete(
                    `http://localhost:5000/api/users/${userId}/follow`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setFollowStatus(prev => ({ ...prev, [userId]: false }));
            } else {
                await axios.post(
                    `http://localhost:5000/api/users/${userId}/follow`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setFollowStatus(prev => ({ ...prev, [userId]: true }));
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            alert(error.response?.data?.message || 'Failed to update connection');
        }
    };

    const handleProfileClick = (userId) => {
        if (user && user.id === userId) {
            navigate('/profile');
        } else {
            navigate(`/profile/${userId}`);
        }
    };

    const fetchComments = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                `http://localhost:5000/api/posts/${postId}/comments`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setComments(prev => ({ ...prev, [postId]: data }));
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const toggleComments = (postId) => {
        const newShowState = !showComments[postId];
        setShowComments(prev => ({ ...prev, [postId]: newShowState }));
        setActivePostMenu(null);

        if (newShowState && !comments[postId]) {
            fetchComments(postId);
        }
    };

    const handleCommentSubmit = async (postId, e) => {
        e.preventDefault();
        const content = commentInputs[postId];

        if (!content || content.trim() === '') return;

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                `http://localhost:5000/api/posts/${postId}/comments`,
                { content },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setComments(prev => ({
                ...prev,
                [postId]: [data, ...(prev[postId] || [])]
            }));

            setPosts(posts.map(post =>
                post.id === postId
                    ? { ...post, comment_count: parseInt(post.comment_count) + 1 }
                    : post
            ));

            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const togglePostMenu = (postId) => {
        setActivePostMenu(activePostMenu === postId ? null : postId);
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (loading) {
        return (
            <div className="home-loading">
                <div className="loading-posts">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="post-skeleton">
                            <div className="skeleton-header">
                                <div className="skeleton-avatar"></div>
                                <div className="skeleton-info">
                                    <div className="skeleton-text"></div>
                                    <div className="skeleton-subtext"></div>
                                </div>
                            </div>
                            <div className="skeleton-media"></div>
                            <div className="skeleton-actions"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="instax-home">
            {/* Stories Section */}
            <div className="stories-container">
                <div className="stories-header">
                    <h3>Stories</h3>
                    <button className="view-all-stories">View All</button>
                </div>
                <div className="stories-list">
                    {/* Add story creation button */}
                    <div className="story-item create-story">
                        <div className="story-avatar">
                            <FaCamera />
                        </div>
                        <span>Create Story</span>
                    </div>
                    
                    {/* Story items would go here */}
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="story-item">
                            <div className="story-avatar">
                                <img 
                                    src={`https://picsum.photos/seed/${i}/56`} 
                                    alt={`User ${i}`}
                                />
                            </div>
                            <span>User {i}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Posts Feed */}
            <div className="posts-feed">
                {posts.length === 0 ? (
                    <div className="empty-feed">
                        <div className="empty-feed-content">
                            <div className="empty-feed-icon">
                                <FaCamera />
                            </div>
                            <h3>No Posts Yet</h3>
                            <p>Start following people or create your first post!</p>
                            <button 
                                className="btn btn-primary"
                                onClick={() => navigate('/create')}
                            >
                                Create Your First Post
                            </button>
                        </div>
                    </div>
                ) : (
                    posts.map((post) => (
                        <div className="instax-post" key={post.id}>
                            {/* Post Header */}
                            <div className="post-header">
                                <div className="post-user">
                                    <div 
                                        className="user-avatar"
                                        onClick={() => handleProfileClick(post.user_id)}
                                    >
                                        <img
                                            src={post.avatar_url || `https://picsum.photos/seed/${post.user_id}/40`}
                                            alt={post.username}
                                        />
                                    </div>
                                    <div className="user-info">
                                        <span 
                                            className="username"
                                            onClick={() => handleProfileClick(post.user_id)}
                                        >
                                            {post.username}
                                        </span>
                                        <span className="post-time">
                                            {new Date(post.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="post-header-actions">
                                    {user && user.id !== post.user_id && (
                                        <button
                                            className={`follow-btn ${followStatus[post.user_id] ? 'following' : ''}`}
                                            onClick={() => handleFollow(post.user_id, followStatus[post.user_id])}
                                        >
                                            {followStatus[post.user_id] ? <FaUserCheck /> : <FaUserPlus />}
                                            <span>{followStatus[post.user_id] ? 'Following' : 'Follow'}</span>
                                        </button>
                                    )}
                                    
                                    <button 
                                        className="post-menu-btn"
                                        onClick={() => togglePostMenu(post.id)}
                                    >
                                        <FaEllipsisH />
                                    </button>
                                    
                                    {activePostMenu === post.id && (
                                        <div className="post-dropdown-menu">
                                            {user && user.id === post.user_id && (
                                                <>
                                                    <button className="dropdown-item">Edit Post</button>
                                                    <button 
                                                        className="dropdown-item delete"
                                                        onClick={() => handleDeletePost(post.id)}
                                                    >
                                                        Delete Post
                                                    </button>
                                                </>
                                            )}
                                            <button className="dropdown-item">Report</button>
                                            <button className="dropdown-item">Copy Link</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Post Media */}
                            <div className="post-media">
                                {post.media_type === 'video' ? (
                                    <video
                                        src={post.video_url}
                                        controls
                                        className="post-video"
                                        preload="metadata"
                                    />
                                ) : (
                                    <img
                                        src={post.image_url}
                                        alt={post.caption}
                                        className="post-image"
                                        loading="lazy"
                                    />
                                )}
                            </div>

                            {/* Post Actions */}
                            <div className="post-actions">
                                <div className="post-actions-left">
                                    <button
                                        className={`action-btn like-btn ${post.liked_by_user ? 'active' : ''}`}
                                        onClick={() => handleLike(post.id, post.liked_by_user)}
                                    >
                                        {post.liked_by_user ? <FaHeart /> : <FaRegHeart />}
                                        <span>{formatNumber(post.like_count)}</span>
                                    </button>
                                    
                                    <button
                                        className="action-btn comment-btn"
                                        onClick={() => toggleComments(post.id)}
                                    >
                                        <FaComment />
                                        <span>{formatNumber(post.comment_count)}</span>
                                    </button>
                                    
                                    <button className="action-btn share-btn">
                                        <FaShare />
                                        <span>Share</span>
                                    </button>
                                </div>
                                
                                <button
                                    className={`action-btn save-btn ${savedPosts[post.id] ? 'active' : ''}`}
                                    onClick={() => handleSavePost(post.id, savedPosts[post.id])}
                                >
                                    {savedPosts[post.id] ? <FaBookmark /> : <FaRegBookmark />}
                                </button>
                            </div>

                            {/* Post Caption */}
                            {post.caption && (
                                <div className="post-caption">
                                    <span 
                                        className="caption-username"
                                        onClick={() => handleProfileClick(post.user_id)}
                                    >
                                        {post.username}
                                    </span>
                                    <span className="caption-text">{post.caption}</span>
                                </div>
                            )}

                            {/* Comments Section */}
                            {parseInt(post.comment_count) > 0 && (
                                <button
                                    className="view-comments-btn"
                                    onClick={() => toggleComments(post.id)}
                                >
                                    {showComments[post.id] ? 'Hide' : 'View'} {post.comment_count} comments
                                </button>
                            )}

                            {showComments[post.id] && (
                                <div className="comments-section">
                                    {comments[post.id]?.map(comment => (
                                        <div key={comment.id} className="comment">
                                            <div className="comment-avatar">
                                                <img
                                                    src={comment.avatar_url || `https://picsum.photos/seed/${comment.user_id}/32`}
                                                    alt={comment.username}
                                                />
                                            </div>
                                            <div className="comment-content">
                                                <span className="comment-author">{comment.username}</span>
                                                <span className="comment-text">{comment.content}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Comment Form */}
                            <form
                                className="comment-form"
                                onSubmit={(e) => handleCommentSubmit(post.id, e)}
                            >
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({
                                        ...prev,
                                        [post.id]: e.target.value
                                    }))}
                                    className="comment-input"
                                />
                                <button
                                    type="submit"
                                    className="comment-submit-btn"
                                    disabled={!commentInputs[post.id]?.trim()}
                                >
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </div>
                    ))
                )}
            </div>
            
            {/* Suggestions Sidebar (Desktop) */}
            <div className="suggestions-sidebar">
                <div className="current-user">
                    <div className="current-user-avatar">
                        <img
                            src={user?.avatar_url || `https://picsum.photos/seed/${user?.id}/56`}
                            alt={user?.username}
                        />
                    </div>
                    <div className="current-user-info">
                        <span className="current-username">{user?.username}</span>
                        <span className="current-user-name">{user?.name || user?.username}</span>
                    </div>
                </div>
                
                <div className="suggestions-header">
                    <h4>Suggestions For You</h4>
                    <button className="see-all">See All</button>
                </div>
                
                <div className="suggestions-list">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="suggestion-item">
                            <div className="suggestion-avatar">
                                <img 
                                    src={`https://picsum.photos/seed/suggestion${i}/40`} 
                                    alt={`Suggested User ${i}`}
                                />
                            </div>
                            <div className="suggestion-info">
                                <span className="suggestion-username">user{i}</span>
                                <span className="suggestion-text">Suggested for you</span>
                            </div>
                            <button className="follow-suggestion-btn">Follow</button>
                        </div>
                    ))}
                </div>
                
                <div className="sidebar-footer">
                    <div className="footer-links">
                        <a href="#">About</a> • <a href="#">Help</a> • <a href="#">Press</a> • <a href="#">API</a> • <a href="#">Jobs</a> • <a href="#">Privacy</a> • <a href="#">Terms</a> • <a href="#">Locations</a> • <a href="#">Language</a>
                    </div>
                    <div className="copyright">
                        © {new Date().getFullYear()} INSTAX FROM PRASANTH
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
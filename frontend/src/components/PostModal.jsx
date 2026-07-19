import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    FaHeart, 
    FaRegHeart, 
    FaTimes, 
    FaPaperPlane, 
    FaBookmark, 
    FaRegBookmark,
    FaEllipsisH,
    FaShare,
    FaComment,
    FaSmile,
    FaFlag,
    FaTrash,
    FaCopy,
    FaLink
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/PostModal.css';

const PostModal = ({ post, onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [liked, setLiked] = useState(post.liked_by_user || false);
    const [saved, setSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(parseInt(post.like_count) || 0);
    const [commentCount, setCommentCount] = useState(parseInt(post.comment_count) || 0);
    const [showComments, setShowComments] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const modalRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (post) {
            fetchComments();
            checkIfOwner();
            checkFollowStatus();
        }
    }, [post]);

    useEffect(() => {
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        // Close menu when clicking outside
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const checkIfOwner = () => {
        setIsOwner(user && user.id === post.user_id);
    };

    const checkFollowStatus = async () => {
        if (user && user.id !== post.user_id) {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(
                    `http://localhost:5000/api/users/${post.user_id}/stats`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setIsFollowing(data.isFollowing);
            } catch (error) {
                console.error('Error checking follow status:', error);
            }
        }
    };

    const fetchComments = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                `http://localhost:5000/api/posts/${post.id}/comments`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleLike = async () => {
        try {
            const token = localStorage.getItem('token');
            if (liked) {
                await axios.delete(
                    `http://localhost:5000/api/posts/${post.id}/like`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setLiked(false);
                setLikeCount(prev => prev - 1);
            } else {
                await axios.post(
                    `http://localhost:5000/api/posts/${post.id}/like`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setLiked(true);
                setLikeCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            if (saved) {
                await axios.delete(
                    `http://localhost:5000/api/posts/${post.id}/save`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSaved(false);
            } else {
                await axios.post(
                    `http://localhost:5000/api/posts/${post.id}/save`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSaved(true);
            }
        } catch (error) {
            console.error('Error toggling save:', error);
        }
    };

    const handleFollow = async () => {
        try {
            const token = localStorage.getItem('token');
            if (isFollowing) {
                await axios.delete(
                    `http://localhost:5000/api/users/${post.user_id}/follow`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setIsFollowing(false);
            } else {
                await axios.post(
                    `http://localhost:5000/api/users/${post.user_id}/follow`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                `http://localhost:5000/api/posts/${post.id}/comments`,
                { content: newComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setComments([data, ...comments]);
            setCommentCount(prev => prev + 1);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleDeletePost = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(
                    `http://localhost:5000/api/posts/${post.id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                onClose();
                // Optionally refresh parent component
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Failed to delete post');
            }
        }
        setShowMenu(false);
    };

    const handleCopyLink = () => {
        const postLink = `${window.location.origin}/post/${post.id}`;
        navigator.clipboard.writeText(postLink).then(() => {
            alert('Link copied to clipboard!');
        });
        setShowMenu(false);
    };

    const handleProfileClick = () => {
        if (user && user.id === post.user_id) {
            navigate('/profile');
        } else {
            navigate(`/profile/${post.user_id}`);
        }
        onClose();
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
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

    const handleBackdropClick = (e) => {
        if (e.target.className === 'instax-post-modal-backdrop') {
            onClose();
        }
    };

    if (!post) return null;

    return (
        <div className="instax-post-modal-backdrop" onClick={handleBackdropClick}>
            <div className="instax-post-modal" ref={modalRef}>
                <button className="modal-close-btn" onClick={onClose}>
                    <FaTimes />
                </button>

                <div className="modal-content">
                    {/* Left side - Media */}
                    <div className="modal-media-section">
                        <div className="media-container">
                            {post.media_type === 'video' ? (
                                <video 
                                    src={post.video_url} 
                                    controls 
                                    className="modal-media" 
                                    poster={post.thumbnail_url}
                                />
                            ) : (
                                <img 
                                    src={post.image_url} 
                                    alt={post.caption} 
                                    className="modal-media"
                                    loading="lazy"
                                />
                            )}
                        </div>
                    </div>

                    {/* Right side - Details */}
                    <div className="modal-details-section">
                        {/* Header */}
                        <div className="modal-header">
                            <div className="user-info" onClick={handleProfileClick}>
                                <img
                                    src={post.avatar_url || `https://picsum.photos/seed/${post.user_id}/40`}
                                    alt={post.username}
                                    className="user-avatar"
                                />
                                <div className="user-details">
                                    <span className="username">{post.username}</span>
                                    <span className="post-time">{formatTime(post.created_at)}</span>
                                </div>
                            </div>
                            
                            <div className="header-actions">
                                {!isOwner && (
                                    <button 
                                        className={`follow-btn ${isFollowing ? 'following' : ''}`}
                                        onClick={handleFollow}
                                    >
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                )}
                                
                                <div className="modal-menu" ref={menuRef}>
                                    <button 
                                        className="menu-btn"
                                        onClick={() => setShowMenu(!showMenu)}
                                    >
                                        <FaEllipsisH />
                                    </button>
                                    
                                    {showMenu && (
                                        <div className="modal-dropdown-menu">
                                            {isOwner ? (
                                                <>
                                                    <button className="dropdown-item">
                                                        <FaShare />
                                                        Edit Post
                                                    </button>
                                                    <button 
                                                        className="dropdown-item delete"
                                                        onClick={handleDeletePost}
                                                    >
                                                        <FaTrash />
                                                        Delete Post
                                                    </button>
                                                </>
                                            ) : (
                                                <button className="dropdown-item">
                                                    <FaFlag />
                                                    Report Post
                                                </button>
                                            )}
                                            <button 
                                                className="dropdown-item"
                                                onClick={handleCopyLink}
                                            >
                                                <FaLink />
                                                Copy Link
                                            </button>
                                            <button className="dropdown-item">
                                                <FaCopy />
                                                Embed
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="modal-comments-section">
                            {/* Caption */}
                            <div className="comment-item caption-comment">
                                <img
                                    src={post.avatar_url || `https://picsum.photos/seed/${post.user_id}/32`}
                                    alt={post.username}
                                    className="comment-avatar"
                                />
                                <div className="comment-content">
                                    <div className="comment-header">
                                        <span className="comment-author" onClick={handleProfileClick}>
                                            {post.username}
                                        </span>
                                        <span className="comment-time">{formatTime(post.created_at)}</span>
                                    </div>
                                    {post.caption && (
                                        <p className="comment-text">{post.caption}</p>
                                    )}
                                </div>
                            </div>

                            {/* Comments List */}
                            {showComments && comments.length > 0 && (
                                <div className="comments-list">
                                    {comments.map(comment => (
                                        <div key={comment.id} className="comment-item">
                                            <img
                                                src={comment.avatar_url || `https://picsum.photos/seed/${comment.user_id}/32`}
                                                alt={comment.username}
                                                className="comment-avatar"
                                                onClick={() => navigate(`/profile/${comment.user_id}`)}
                                            />
                                            <div className="comment-content">
                                                <div className="comment-header">
                                                    <span 
                                                        className="comment-author"
                                                        onClick={() => navigate(`/profile/${comment.user_id}`)}
                                                    >
                                                        {comment.username}
                                                    </span>
                                                    <span className="comment-time">{formatTime(comment.created_at)}</span>
                                                </div>
                                                <p className="comment-text">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* View Comments Toggle */}
                            {comments.length > 5 && (
                                <button 
                                    className="view-comments-toggle"
                                    onClick={() => setShowComments(!showComments)}
                                >
                                    {showComments ? 'Hide' : 'View'} {comments.length} comments
                                </button>
                            )}
                        </div>

                        {/* Actions Section */}
                        <div className="modal-actions-section">
                            <div className="action-buttons">
                                <button 
                                    onClick={handleLike} 
                                    className={`action-btn like-btn ${liked ? 'liked' : ''}`}
                                >
                                    {liked ? <FaHeart /> : <FaRegHeart />}
                                </button>
                                <button className="action-btn comment-btn">
                                    <FaComment />
                                </button>
                                <button className="action-btn share-btn">
                                    <FaShare />
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    className={`action-btn save-btn ${saved ? 'saved' : ''}`}
                                >
                                    {saved ? <FaBookmark /> : <FaRegBookmark />}
                                </button>
                            </div>

                            <div className="post-stats">
                                <span className="likes-count">
                                    {formatNumber(likeCount)} likes
                                </span>
                                <span className="comments-count">
                                    {formatNumber(commentCount)} comments
                                </span>
                            </div>

                            <div className="post-meta">
                                <span className="post-timestamp">
                                    {formatTime(post.created_at)}
                                </span>
                            </div>
                        </div>

                        {/* Comment Input */}
                        <form className="modal-comment-form" onSubmit={handleAddComment}>
                            <button type="button" className="emoji-btn">
                                <FaSmile />
                            </button>
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="comment-input"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="comment-submit-btn"
                            >
                                <FaPaperPlane />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostModal;
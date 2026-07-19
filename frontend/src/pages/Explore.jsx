import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
    FaSearch, 
    FaHeart, 
    FaComment,
    FaUser,
    FaVideo,
    FaImage,
    FaArrowRight
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import PostModal from '../components/PostModal';
import '../styles/Explore.css';

const Explore = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const navigate = useNavigate();
    const searchRef = useRef(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                `http://localhost:5000/api/posts/explore`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPosts(data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const token = localStorage.getItem('token');
                
                // Try search endpoint first
                try {
                    const { data } = await axios.get(
                        `http://localhost:5000/api/search?query=${searchQuery}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setSearchResults(data);
                } catch (searchError) {
                    // Fallback to users endpoint
                    const { data } = await axios.get(
                        `http://localhost:5000/api/users/search?query=${searchQuery}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const formattedResults = data.map(user => ({
                        ...user,
                        type: 'user'
                    }));
                    setSearchResults(formattedResults);
                }
            } catch (error) {
                console.error('Error searching:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleUserClick = (userId) => {
        navigate(`/profile/${userId}`);
        setSearchQuery('');
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (loading) {
        return (
            <div className="explore-loading">
                <div className="explore-skeleton">
                    <div className="skeleton-search"></div>
                    <div className="skeleton-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="skeleton-item"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="instax-explore">
            {/* Search Section */}
            <div className="search-section" ref={searchRef}>
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search for users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {searchQuery && (
                            <button 
                                className="clear-search"
                                onClick={() => setSearchQuery('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {searchQuery && (
                        <div className="search-results-dropdown">
                            {isSearching ? (
                                <div className="search-loading">
                                    <div className="loading-spinner-small"></div>
                                    Searching...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <>
                                    <div className="search-results-header">
                                        <h4>Search Results</h4>
                                        <span>{searchResults.length} results</span>
                                    </div>
                                    {searchResults.map((result) => (
                                        <div
                                            key={result.id}
                                            className="search-result-item"
                                            onClick={() => handleUserClick(result.id)}
                                        >
                                            <div className="result-icon">
                                                <FaUser />
                                            </div>
                                            <div className="result-info">
                                                <span className="result-name">
                                                    {result.username}
                                                </span>
                                                <span className="result-details">
                                                    {result.full_name || `@${result.username}`}
                                                </span>
                                            </div>
                                            <FaArrowRight className="result-arrow" />
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="no-results">
                                    <FaSearch className="no-results-icon" />
                                    <p>No users found for "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Posts Grid */}
            <div className="explore-content">
                <div className="explore-main">
                    {posts.length === 0 ? (
                        <div className="empty-explore">
                            <div className="empty-explore-icon">
                                📷
                            </div>
                            <h3>No Posts Found</h3>
                            <p>Be the first to share something!</p>
                        </div>
                    ) : (
                        <div className="explore-grid">
                            {posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="explore-item"
                                    onClick={() => setSelectedPost(post)}
                                >
                                    <div className="post-media">
                                        {post.media_type === 'video' ? (
                                            <>
                                                <video 
                                                    src={post.video_url} 
                                                    className="post-video"
                                                    poster={post.thumbnail_url}
                                                />
                                                <div className="media-badge">
                                                    <FaVideo />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <img 
                                                    src={post.image_url} 
                                                    alt={post.caption || 'Post image'} 
                                                    className="post-image"
                                                    loading="lazy"
                                                />
                                                <div className="media-badge">
                                                    <FaImage />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="post-overlay">
                                        <div className="post-stats">
                                            <span className="stat">
                                                <FaHeart />
                                                {formatNumber(post.like_count)}
                                            </span>
                                            <span className="stat">
                                                <FaComment />
                                                {formatNumber(post.comment_count)}
                                            </span>
                                        </div>
                                        <div className="post-caption">
                                            {post.caption && (
                                                <p className="caption-text">
                                                    {post.caption.length > 100 
                                                        ? post.caption.substring(0, 100) + '...' 
                                                        : post.caption}
                                                </p>
                                            )}
                                            <span className="post-author">
                                                @{post.username}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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

export default Explore;
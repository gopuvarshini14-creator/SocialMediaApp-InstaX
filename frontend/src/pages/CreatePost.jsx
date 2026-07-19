import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    FaCloudUploadAlt, 
    FaImage, 
    FaVideo, 
    FaCamera, 
    FaSmile, 
    FaMapMarkerAlt, 
    FaTag,
    FaUsers,
    FaSpinner,
    
    FaTimes,
    FaArrowLeft,
    FaPaperPlane,
    FaPaintBrush,
    FaMusic,
    FaFilter
} from 'react-icons/fa';
import '../styles/CreatePost.css';

const CreatePost = () => {
    const [caption, setCaption] = useState('');
    const [media, setMedia] = useState(null);
    const [preview, setPreview] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [step, setStep] = useState(1); // 1: Upload, 2: Edit, 3: Details
    const [filters, setFilters] = useState(['normal', 'clarendon', 'moon', 'lark', 'gingham']);
    const [activeFilter, setActiveFilter] = useState('normal');
    const [location, setLocation] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [audience, setAudience] = useState('public'); // public, followers, private
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const captionRef = useRef(null);

    const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 50MB for images, 500MB for videos)
            const maxSize = file.type.startsWith('video/') ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
            if (file.size > maxSize) {
                alert(`File is too large. Maximum size is ${file.type.startsWith('video/') ? '500MB' : '50MB'}`);
                return;
            }

            setMedia(file);
            setPreview(URL.createObjectURL(file));
            setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
            setStep(2); // Move to edit step
            setUploadProgress(0);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleRemoveMedia = () => {
        setMedia(null);
        setPreview(null);
        setMediaType(null);
        setStep(1);
        setUploadProgress(0);
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            const tag = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
            if (!tags.includes(tag) && tags.length < 10) {
                setTags([...tags, tag]);
            }
            setTagInput('');
            e.preventDefault();
        }
    };

    const removeTag = (index) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!media) {
            alert('Please select a file');
            return;
        }

        console.log('Starting upload...');
        console.log('Media file:', media);
        console.log('Media type:', mediaType);
        console.log('Caption:', caption);
        console.log('Tags:', tags);
        console.log('Location:', location);
        console.log('Audience:', audience);

        setLoading(true);
        const formData = new FormData();
        formData.append('media', media);
        formData.append('caption', caption);
        formData.append('tags', JSON.stringify(tags));
        formData.append('location', location);
        formData.append('audience', audience);
        formData.append('filter', activeFilter);

        console.log('FormData created');

        try {
            const token = localStorage.getItem('token');
            console.log('Sending request to backend...');

            const response = await axios.post('http://localhost:5000/api/posts', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                    console.log('Upload progress:', percentCompleted + '%');
                },
                timeout: 300000, // 5 minute timeout for large videos
            });

            console.log('Upload successful!', response.data);
            alert('Post created successfully!');
            navigate('/');
        } catch (error) {
            console.error('Error creating post:', error);
            console.error('Error response:', error.response);
            console.error('Error message:', error.message);
            alert(`Failed to create post: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const goBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            navigate('/');
        }
    };

    const emojis = ['😊', '❤️', '🔥', '👍', '🎉', '😍', '👏', '🙌', '🤩', '😎', '✨', '🌟'];

    const handleEmojiClick = (emoji) => {
        const textarea = captionRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newCaption = caption.substring(0, start) + emoji + caption.substring(end);
        setCaption(newCaption);
        setShowEmojiPicker(false);
        
        // Focus back on textarea and set cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 0);
    };

    return (
        <div className="instax-create-post">
            {/* Header */}
            <div className="create-post-header">
                <button className="back-btn" onClick={goBack}>
                    <FaArrowLeft />
                </button>
                <h2>Create New Post</h2>
                {step === 3 && (
                    <button 
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !media}
                        className="share-btn"
                    >
                        {loading ? (
                            <>
                                <FaSpinner className="spinner" />
                                Sharing...
                            </>
                        ) : (
                            <>
                                <FaPaperPlane />
                                Share
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Progress Steps */}
            <div className="progress-steps">
                <div className={`step ${step >= 1 ? 'active' : ''}`}>
                    <div className="step-circle">1</div>
                    <span>Upload</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${step >= 2 ? 'active' : ''}`}>
                    <div className="step-circle">2</div>
                    <span>Edit</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${step >= 3 ? 'active' : ''}`}>
                    <div className="step-circle">3</div>
                    <span>Details</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="create-post-content">
                {step === 1 && (
                    <div className="upload-step">
                        <div className="upload-card">
                            <div className="upload-icon">
                                <FaCloudUploadAlt />
                            </div>
                            <h3>Drag photos and videos here</h3>
                            <p>or click to select files</p>
                            <div className="supported-formats">
                                <span><FaImage /> Supports: JPG, PNG, GIF</span>
                                <span><FaVideo /> Video: MP4, MOV, AVI</span>
                            </div>
                            <button 
                                className="btn btn-primary"
                                onClick={triggerFileInput}
                            >
                                <FaCamera />
                                Select from device
                            </button>
                            <input
                                ref={fileInputRef}
                                id="file-upload"
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleMediaChange}
                                hidden
                            />
                        </div>

                        <div className="upload-options">
                            <div className="option-card">
                                <div className="option-icon">
                                    <FaPaintBrush />
                                </div>
                                <h4>Create Story</h4>
                                <p>Share moments that disappear in 24 hours</p>
                            </div>
                            <div className="option-card">
                                <div className="option-icon">
                                    <FaMusic />
                                </div>
                                <h4>Create Reel</h4>
                                <p>Make short, entertaining videos</p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && preview && (
                    <div className="edit-step">
                        <div className="edit-container">
                            <div className="media-preview-section">
                                <div className="preview-wrapper">
                                    {mediaType === 'video' ? (
                                        <video 
                                            src={preview} 
                                            controls 
                                            className="edit-preview-video" 
                                            style={{ filter: `url(#${activeFilter})` }}
                                        />
                                    ) : (
                                        <img 
                                            src={preview} 
                                            alt="Preview" 
                                            className="edit-preview-image"
                                            style={{ filter: activeFilter !== 'normal' ? activeFilter : 'none' }}
                                        />
                                    )}
                                </div>
                                
                                {/* Filters */}
                                <div className="filters-section">
                                    <h4>Filters</h4>
                                    <div className="filters-list">
                                        {filters.map(filter => (
                                            <button
                                                key={filter}
                                                className={`filter-option ${activeFilter === filter ? 'active' : ''}`}
                                                onClick={() => setActiveFilter(filter)}
                                            >
                                                <div className={`filter-preview ${filter}`}></div>
                                                <span className="filter-name">{filter}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="edit-tools">
                                <h4>Edit Tools</h4>
                                <div className="tool-buttons">
                                    <button className="tool-btn">
                                        <FaPaintBrush />
                                        <span>Adjust</span>
                                    </button>
                                    <button className="tool-btn">
                                        <FaFilter />
                                        <span>Effects</span>
                                    </button>
                                    <button className="tool-btn">
                                        <FaTag />
                                        <span>Tag People</span>
                                    </button>
                                    <button className="tool-btn">
                                        <FaMapMarkerAlt />
                                        <span>Add Location</span>
                                    </button>
                                </div>
                                
                                <button 
                                    className="btn btn-primary next-btn"
                                    onClick={() => setStep(3)}
                                >
                                    Next: Add Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && preview && (
                    <div className="details-step">
                        <div className="details-container">
                            <div className="final-preview">
                                {mediaType === 'video' ? (
                                    <video 
                                        src={preview} 
                                        controls 
                                        className="final-preview-video"
                                        style={{ filter: `url(#${activeFilter})` }}
                                    />
                                ) : (
                                    <img 
                                        src={preview} 
                                        alt="Preview" 
                                        className="final-preview-image"
                                        style={{ filter: activeFilter !== 'normal' ? activeFilter : 'none' }}
                                    />
                                )}
                            </div>

                            <div className="details-form">
                                {/* Author Info */}
                                <div className="author-info">
                                    <img 
                                        src={localStorage.getItem('avatar') || `https://picsum.photos/seed/user/40`}
                                        alt="You"
                                        className="author-avatar"
                                    />
                                    <span className="author-name">You</span>
                                </div>

                                {/* Caption */}
                                <div className="caption-section">
                                    <div className="section-header">
                                        <h4>Caption</h4>
                                        <div className="caption-tools">
                                            <button 
                                                type="button"
                                                className="tool-icon"
                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            >
                                                <FaSmile />
                                            </button>
                                            <span className="char-count">{caption.length}/2200</span>
                                        </div>
                                    </div>
                                    <textarea
                                        ref={captionRef}
                                        placeholder="Write a caption..."
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        className="caption-textarea"
                                        maxLength={2200}
                                        rows={4}
                                    />
                                    
                                    {showEmojiPicker && (
                                        <div className="emoji-picker">
                                            <div className="emoji-grid">
                                                {emojis.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        className="emoji-btn"
                                                        onClick={() => handleEmojiClick(emoji)}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tags */}
                                <div className="tags-section">
                                    <h4>Tags</h4>
                                    <div className="tags-input-container">
                                        <input
                                            type="text"
                                            placeholder="Add a tag (press Enter)"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyPress={handleAddTag}
                                            className="tags-input"
                                        />
                                        <FaTag className="tag-icon" />
                                    </div>
                                    <div className="tags-list">
                                        {tags.map((tag, index) => (
                                            <span key={index} className="tag-item">
                                                {tag}
                                                <button 
                                                    type="button"
                                                    className="remove-tag"
                                                    onClick={() => removeTag(index)}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="location-section">
                                    <h4>Location</h4>
                                    <div className="location-input-container">
                                        <FaMapMarkerAlt className="location-icon" />
                                        <input
                                            type="text"
                                            placeholder="Add location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="location-input"
                                        />
                                    </div>
                                </div>

                                {/* Audience */}
                                <div className="audience-section">
                                    <h4>Audience</h4>
                                    <div className="audience-options">
                                        <label className={`audience-option ${audience === 'public' ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="audience"
                                                value="public"
                                                checked={audience === 'public'}
                                                onChange={(e) => setAudience(e.target.value)}
                                            />
                                            <div className="option-content">
                                                <FaUsers className="option-icon" />
                                                <div className="option-text">
                                                    <strong>Public</strong>
                                                    <span>Anyone can see this post</span>
                                                </div>
                                            </div>
                                        </label>
                                        
                                        <label className={`audience-option ${audience === 'followers' ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="audience"
                                                value="followers"
                                                checked={audience === 'followers'}
                                                onChange={(e) => setAudience(e.target.value)}
                                            />
                                            <div className="option-content">
                                                <FaUsers className="option-icon" />
                                                <div className="option-text">
                                                    <strong>Followers</strong>
                                                    <span>Only your followers can see</span>
                                                </div>
                                            </div>
                                        </label>
                                        
                                        <label className={`audience-option ${audience === 'private' ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="audience"
                                                value="private"
                                                checked={audience === 'private'}
                                                onChange={(e) => setAudience(e.target.value)}
                                            />
                                            <div className="option-content">
                                                <FaUsers className="option-icon" />
                                                <div className="option-text">
                                                    <strong>Private</strong>
                                                    <span>Only you can see this post</span>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Upload Progress */}
                                {loading && (
                                    <div className="upload-progress">
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        <span className="progress-text">
                                            Uploading... {uploadProgress}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreatePost;
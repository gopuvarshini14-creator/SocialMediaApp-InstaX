import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
    FaPaperPlane, 
    FaSearch, 
    FaVideo, 
    FaPhone, 
    FaEllipsisV, 
    FaImage, 
    FaSmile, 
    FaPaperclip,
    FaCrown,
    FaCheck,
    FaCheckDouble,
    FaRegClock,
    FaRegEdit,
    FaUserPlus
} from 'react-icons/fa';
import '../styles/Messages.css';

const Messages = () => {
    const { user } = useAuth();
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        fetchConnectedUsers();
        const interval = setInterval(fetchConnectedUsers, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id);
            fetchConnectedUsers();
            
            const messageInterval = setInterval(() => {
                fetchMessages(selectedUser.id);
            }, 3000);
            
            // Simulate typing indicator (demo)
            const typingInterval = setInterval(() => {
                if (Math.random() > 0.7 && messages.length > 0) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 2000);
                }
            }, 8000);
            
            return () => {
                clearInterval(messageInterval);
                clearInterval(typingInterval);
                setIsTyping(false);
            };
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConnectedUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                'http://localhost:5000/api/messages/connected-users',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setConnectedUsers(data);
        } catch (error) {
            console.error('Error fetching connected users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                `http://localhost:5000/api/messages/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessages(data);
            fetchConnectedUsers();
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setShowMobileChat(true);
        setIsTyping(false);
    };

    const handleBackToUsers = () => {
        setShowMobileChat(false);
        setSelectedUser(null);
        fetchConnectedUsers();
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                'http://localhost:5000/api/messages',
                {
                    receiverId: selectedUser.id,
                    content: newMessage
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessages([...messages, data]);
            setNewMessage('');
            inputRef.current?.focus();
        } catch (error) {
            console.error('Error sending message:', error);
            alert(error.response?.data?.message || 'Failed to send message');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const filteredUsers = connectedUsers.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="messages-loading">
                <div className="loading-chats">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="chat-skeleton">
                            <div className="skeleton-avatar"></div>
                            <div className="skeleton-info">
                                <div className="skeleton-name"></div>
                                <div className="skeleton-message"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="instax-messages">
            {/* Left Sidebar - Chat List */}
            <div className={`messages-sidebar ${showMobileChat ? 'hidden-mobile' : ''}`}>
                <div className="sidebar-header">
                    <div className="user-profile">
                        <img
                            src={user?.avatar_url || `https://picsum.photos/seed/${user?.id}/40`}
                            alt={user?.username}
                            className="sidebar-user-avatar"
                        />
                        <div className="user-status">
                            <h3>{user?.username}</h3>
                            <span className="status-dot online"></span>
                            <span className="status-text">Online</span>
                        </div>
                    </div>
                    <button className="new-chat-btn">
                        <FaRegEdit />
                    </button>
                </div>

                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="chat-list">
                    <div className="chat-list-header">
                        <h4>Messages</h4>
                        <span className="message-count">{connectedUsers.length}</span>
                    </div>

                    {filteredUsers.length === 0 ? (
                        <div className="empty-chats">
                            <div className="empty-chats-icon">
                                <FaPaperPlane />
                            </div>
                            <h4>No messages yet</h4>
                            <p>Start a conversation with someone</p>
                            <button className="btn btn-primary">
                                <FaUserPlus />
                                Find People
                            </button>
                        </div>
                    ) : (
                        filteredUsers.map(chatUser => (
                            <div
                                key={chatUser.id}
                                className={`chat-item ${selectedUser?.id === chatUser.id ? 'active' : ''}`}
                                onClick={() => handleUserSelect(chatUser)}
                            >
                                <div className="chat-avatar-wrapper">
                                    <img
                                        src={chatUser.avatar_url || `https://picsum.photos/seed/${chatUser.id}/40`}
                                        alt={chatUser.username}
                                        className="chat-user-avatar"
                                    />
                                    {chatUser.is_online && (
                                        <span className="online-indicator"></span>
                                    )}
                                </div>
                                <div className="chat-info">
                                    <div className="chat-header">
                                        <span className="chat-username">{chatUser.username}</span>
                                        <span className="chat-time">
                                            {new Date(chatUser.last_message_time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="chat-preview">
                                        <span className="last-message">
                                            {chatUser.last_message || 'No messages yet'}
                                        </span>
                                        {chatUser.unread_count > 0 && (
                                            <span className="unread-badge">
                                                {chatUser.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Side - Chat Window */}
            <div className={`chat-container ${showMobileChat ? 'show-mobile' : ''}`}>
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="chat-header">
                            <button className="back-btn" onClick={handleBackToUsers}>
                                <svg width="24" height="24" viewBox="0 0 24 24">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                </svg>
                            </button>
                            <div className="chat-user">
                                <div className="chat-user-avatar-wrapper">
                                    <img
                                        src={selectedUser.avatar_url || `https://picsum.photos/seed/${selectedUser.id}/40`}
                                        alt={selectedUser.username}
                                    />
                                    {selectedUser.is_online && (
                                        <span className="chat-user-online"></span>
                                    )}
                                </div>
                                <div className="chat-user-info">
                                    <h3>{selectedUser.username}</h3>
                                    <span className="user-status-text">
                                        {selectedUser.is_online ? 'Online' : 'Last seen recently'}
                                    </span>
                                </div>
                            </div>
                            <div className="chat-actions">
                                <button className="chat-action-btn">
                                    <FaPhone />
                                </button>
                                <button className="chat-action-btn">
                                    <FaVideo />
                                </button>
                                <button className="chat-action-btn">
                                    <FaEllipsisV />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="messages-area">
                            <div className="chat-date">
                                <span>Today</span>
                            </div>
                            
                            {messages.length === 0 ? (
                                <div className="empty-chat">
                                    <div className="empty-chat-avatar">
                                        <img
                                            src={selectedUser.avatar_url || `https://picsum.photos/seed/${selectedUser.id}/80`}
                                            alt={selectedUser.username}
                                        />
                                    </div>
                                    <h3>{selectedUser.username}</h3>
                                    <p>@{selectedUser.username}</p>
                                    <button className="btn btn-outline">
                                        View Profile
                                    </button>
                                    <div className="empty-chat-message">
                                        <p>Send your first message to start a conversation</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message, index) => (
                                    <div
                                        key={message.id || index}
                                        className={`message-wrapper ${message.sender_id === user.id ? 'sent' : 'received'}`}
                                    >
                                        <div className="message-bubble">
                                            <div className="message-text">
                                                {message.content}
                                            </div>
                                            <div className="message-meta">
                                                <span className="message-time">
                                                    {new Date(message.created_at).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {message.sender_id === user.id && (
                                                    <span className="message-status">
                                                        {message.is_read ? (
                                                            <FaCheckDouble className="read" />
                                                        ) : message.is_sent ? (
                                                            <FaCheck className="sent" />
                                                        ) : (
                                                            <FaRegClock className="pending" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            
                            {isTyping && (
                                <div className="typing-indicator">
                                    <div className="typing-bubble">
                                        <div className="typing-dots">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                        <span className="typing-text">typing...</span>
                                    </div>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form className="message-input-area" onSubmit={handleSendMessage}>
                            <div className="input-tools">
                                <button type="button" className="input-tool-btn">
                                    <FaPaperclip />
                                </button>
                                <button type="button" className="input-tool-btn">
                                    <FaImage />
                                </button>
                            </div>
                            <div className="message-input-wrapper">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="message-input"
                                />
                                <button type="button" className="emoji-btn">
                                    <FaSmile />
                                </button>
                            </div>
                            <button
                                type="submit"
                                className="send-message-btn"
                                disabled={!newMessage.trim()}
                            >
                                <FaPaperPlane />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="welcome-screen">
                            <div className="welcome-icon">
                                <FaCrown />
                            </div>
                            <h2>Your Messages</h2>
                            <p>Send private messages to a friend or group</p>
                            <div className="welcome-features">
                                <div className="feature">
                                    <div className="feature-icon">🔒</div>
                                    <div className="feature-text">
                                        <h4>End-to-End Encrypted</h4>
                                        <p>Your messages are secured</p>
                                    </div>
                                </div>
                                <div className="feature">
                                    <div className="feature-icon">⚡</div>
                                    <div className="feature-text">
                                        <h4>Instant Delivery</h4>
                                        <p>Messages are delivered instantly</p>
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-primary">
                                <FaUserPlus />
                                Start New Chat
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
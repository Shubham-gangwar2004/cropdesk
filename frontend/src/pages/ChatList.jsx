import API_URL from '../config.js';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ChatList.css';

const ChatList = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const token = () => localStorage.getItem('token');

  useEffect(() => {
    const t = token();
    if (!t) { navigate('/login'); return; }
    const payload = JSON.parse(atob(t.split('.')[1]));
    setCurrentUserId(payload.id);
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      setChats(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this entire conversation?')) return;
    await fetch(`${API_URL}/api/chats/${chatId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` }
    });
    setChats(c => c.filter(x => x._id !== chatId));
  };

  const getOtherParticipant = (participants) => {
    return participants.find(p => p._id !== currentUserId);
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h1>Messages</h1>
      </div>

      {chats.length === 0 ? (
        <div className="no-chats">
          <p>No conversations yet</p>
          <p>Start chatting with sellers from the marketplace</p>
          <button onClick={() => navigate('/feed')}>Browse Products</button>
        </div>
      ) : (
        <div className="chats-list">
          {chats.map(chat => {
            const otherUser = getOtherParticipant(chat.participants);
            return (
              <div 
                key={chat._id} 
                className="chat-item"
                onClick={() => navigate(`/chat/${chat._id}`)}
              >
                <div className="chat-avatar">
                  {otherUser?.profileImage
                    ? <img src={otherUser.profileImage} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} />
                    : `${otherUser?.fname?.charAt(0)}${otherUser?.lname?.charAt(0)}`}
                </div>
                
                <div className="chat-info">
                  <div className="chat-header-row">
                    <h3>{otherUser?.fname} {otherUser?.lname}</h3>
                    <span className="chat-time">
                      {new Date(chat.lastMessageTime).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {chat.product && (
                    <p className="chat-product">📦 {chat.product.title}</p>
                  )}
                  
                  <p className="chat-last-message">
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>

                <button
                  className="delete-chat-btn"
                  title="Delete conversation"
                  onClick={e => handleDeleteChat(e, chat._id)}
                >🗑</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;
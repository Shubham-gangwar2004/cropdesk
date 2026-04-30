import API_URL from '../config.js';
import { useState, useEffect, useRef, useCallback, use } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import '../styles/ChatWindow.css';

const SOCKET_URL = `${API_URL}`;

const Tick = ({ status }) => {
  if (status === 'seen')      return <span className="tick seen">✓✓</span>;
  if (status === 'delivered') return <span className="tick delivered">✓✓</span>;
  return <span className="tick sent">✓</span>;
};

const ChatWindow = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chat, setChat]           = useState(null);
  const [messages, setMessages]   = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [typing, setTyping]       = useState(false);
  const [selected, setSelected]   = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText]   = useState('');
  const [deleteMenu, setDeleteMenu] = useState(null); // msgId
  const containerRef = useRef(null);
  const socketRef    = useRef(null);
  const typingTimer  = useRef(null);

  const getToken = () => localStorage.getItem('token');

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    const payload = JSON.parse(atob(token.split('.')[1]));
    setCurrentUserId(payload.id);

    // Socket
    socketRef.current = io(SOCKET_URL, { query: { userId: payload.id } });
    socketRef.current.emit('joinChat', chatId);

    socketRef.current.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socketRef.current.on('messageEdited', (msg) => {
      setMessages(prev => prev.map(m => m._id === msg._id ? msg : m));
    });
    socketRef.current.on('messageDeleted', ({ msgId, deleteFor }) => {
      if (deleteFor === 'everyone')
        setMessages(prev => prev.filter(m => m._id !== msgId));
    });
    socketRef.current.on('messagesDeleted', ({ messageIds }) => {
      setMessages(prev => prev.filter(m => !messageIds.includes(m._id)));
    });
    socketRef.current.on('messagesSeen', () => {
      setMessages(prev => prev.map(m => m.status !== 'seen' ? { ...m, status: 'seen' } : m));
    });
    socketRef.current.on('typing', () => setTyping(true));
    socketRef.current.on('stopTyping', () => setTyping(false));

    fetchChat(payload.id);
    fetchMessages();

    return () => socketRef.current?.disconnect();
  }, [chatId]);

  useEffect(() => {
    if (containerRef.current)
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchChat = async (uid) => {
    try {
      const res = await fetch(`${API_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setChat(data.find(c => c._id === chatId));
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // ── send ──────────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    socketRef.current?.emit('stopTyping', { chatId });
    await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ message: newMessage })
    });
    setNewMessage('');
  };

  // ── typing indicator ──────────────────────────────────────────────────────
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    socketRef.current?.emit('typing', { chatId, userId: currentUserId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('stopTyping', { chatId });
    }, 1500);
  };

  // ── edit ──────────────────────────────────────────────────────────────────
  const handleEdit = async (msgId) => {
    if (!editText.trim()) return;
    const res = await fetch(`${API_URL}/api/chats/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ message: editText })
    });
    const updated = await res.json();
    setMessages(prev => prev.map(m => m._id === msgId ? updated : m));
    setEditingId(null);
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (msgId, deleteFor) => {
    await fetch(`${API_URL}/api/chats/messages/${msgId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ deleteFor })
    });
    setMessages(prev => prev.filter(m => m._id !== msgId));
    setDeleteMenu(null);
  };

  const handleDeleteSelected = async (deleteFor) => {
    await fetch(`${API_URL}/api/chats/messages`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ messageIds: [...selected], deleteFor })
    });
    setMessages(prev => prev.filter(m => !selected.has(m._id)));
    setSelected(new Set());
    setSelectMode(false);
  };

  // ── favourite ─────────────────────────────────────────────────────────────
  const handleFavourite = async (msgId) => {
    const res = await fetch(`${API_URL}/api/chats/messages/${msgId}/favourite`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const updated = await res.json();
    setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isFavourite: updated.isFavourite } : m));
  };

  const toggleSelect = (msgId) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      return next;
    });
  };

  const otherUser = chat?.participants?.find(p => p._id !== currentUserId);

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <div className="chat-window-container">
      {/* Header */}
      <div className="chat-window-header">
        <button className="back-btn" onClick={() => navigate('/chats')}>← Back</button>
        <div className="chat-user-info">
          <div className="chat-avatar-small">
            {otherUser?.profileImage
              ? <img src={otherUser.profileImage} alt="" />
              : `${otherUser?.fname?.charAt(0)}${otherUser?.lname?.charAt(0)}`}
          </div>
          <div>
            <h3>{otherUser?.fname} {otherUser?.lname}</h3>
            {typing
              ? <p className="typing-indicator">typing...</p>
              : chat?.product && <p className="chat-product-name">📦 {chat.product.title}</p>}
          </div>
        </div>
        <div className="chat-header-actions">
          {chat?.product && (
            <button className="view-product-btn" onClick={() => navigate(`/product/${chat.product._id}`)}>
              View Product
            </button>
          )}
          <button
            className={`select-mode-btn ${selectMode ? 'active' : ''}`}
            onClick={() => { setSelectMode(v => !v); setSelected(new Set()); }}
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>
          {selectMode && selected.size > 0 && (
            <div className="bulk-delete-menu">
              <button className="delete-selected-btn" onClick={() => handleDeleteSelected('me')}>
                🗑 Delete for me ({selected.size})
              </button>
              <button className="delete-selected-btn red" onClick={() => handleDeleteSelected('everyone')}>
                🗑 Delete for all ({selected.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container" ref={containerRef}>
        {messages.length === 0
          ? <div className="no-messages"><p>No messages yet. Start the conversation!</p></div>
          : messages.map(msg => {
              const isMine = msg.senderId?._id === currentUserId || msg.senderId === currentUserId;
              const isSelected = selected.has(msg._id);
              return (
                <div
                  key={msg._id}
                  className={`message ${isMine ? 'sent' : 'received'} ${isSelected ? 'msg-selected' : ''}`}
                  onClick={() => selectMode && toggleSelect(msg._id)}
                >
                  {selectMode && (
                    <input type="checkbox" className="msg-checkbox" checked={isSelected}
                      onChange={() => toggleSelect(msg._id)} onClick={e => e.stopPropagation()} />
                  )}

                  <div className="message-bubble">
                    {editingId === msg._id ? (
                      <div className="edit-form">
                        <input value={editText} onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleEdit(msg._id)} autoFocus />
                        <button onClick={() => handleEdit(msg._id)}>Save</button>
                        <button onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <p>{msg.message}</p>
                    )}
                    <div className="message-meta">
                      <span className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.isEdited && <span className="edited-tag"> edited</span>}
                        {msg.isFavourite && <span> ⭐</span>}
                      </span>
                      {isMine && <Tick status={msg.status} />}
                    </div>
                  </div>

                  {!selectMode && (
                    <div className="msg-actions">
                      <button className="fav-btn" onClick={() => handleFavourite(msg._id)}
                        title={msg.isFavourite ? 'Unfavourite' : 'Favourite'}>
                        {msg.isFavourite ? '★' : '☆'}
                      </button>
                      {isMine && (
                        <button className="edit-btn" onClick={() => { setEditingId(msg._id); setEditText(msg.message); }}
                          title="Edit">✏️</button>
                      )}
                      <div className="delete-wrapper">
                        <button className="del-btn" onClick={() => setDeleteMenu(deleteMenu === msg._id ? null : msg._id)}
                          title="Delete">🗑</button>
                        {deleteMenu === msg._id && (
                          <div className="delete-dropdown">
                            <button onClick={() => handleDelete(msg._id, 'me')}>Delete for me</button>
                            {isMine && <button onClick={() => handleDelete(msg._id, 'everyone')}>Delete for everyone</button>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        }
      </div>

      {/* Input */}
      <form className="message-input-form" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleTyping}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatWindow;

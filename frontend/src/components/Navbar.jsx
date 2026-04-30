import API_URL from '../config.js';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23c8d6c8'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23789878'/%3E%3Cellipse cx='50' cy='85' rx='28' ry='20' fill='%23789878'/%3E%3C/svg%3E";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [userRole, setUserRole]       = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close everything on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const loadUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch {}
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => setProfileImage(data.profileImage || ''))
        .catch(() => {});
    } else {
      setIsLoggedIn(false);
      setUserRole('');
      setProfileImage('');
    }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener('profileUpdated', loadUser);
    return () => window.removeEventListener('profileUpdated', loadUser);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole('');
    setProfileImage('');
    setMobileOpen(false);
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <Link to="/" className="navbar-logo">🌾 CropDesk</Link>

        {/* Right side: avatar (always visible) + hamburger */}
        <div className="navbar-right">

          {/* Hamburger */}
          <button
            className={`navbar-toggle ${mobileOpen ? 'open' : ''}`}
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen(v => !v)}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>

        {/* Nav links */}
        <ul className={`navbar-menu ${mobileOpen ? 'active' : ''}`}>
          <li><Link to="/">Home</Link></li>

          {isLoggedIn ? (
            <>
              {userRole === 'farmer' && (
                <>
                  <li><Link to="/add-product">Post Crop</Link></li>
                  <li><Link to="/my-listings">My Listings</Link></li>
                </>
              )}
              <li><Link to="/chats">Messages</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
        {/* Avatar — always in header, never inside the menu */}
          {isLoggedIn && (
            <div className="avatar-menu-item" ref={dropdownRef}>
              <button className="avatar-btn" onClick={() => setDropdownOpen(v => !v)} aria-label="Account menu">
                <img src={profileImage || DEFAULT_AVATAR} alt="Profile" className="nav-avatar" />
              </button>
              {dropdownOpen && (
                <div className="avatar-dropdown">
                  <Link to="/my-account" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    👤 My Account
                  </Link>
                  <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}
      </div>
    </nav>
  );
};

export default Navbar;

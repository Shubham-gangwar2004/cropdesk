import API_URL from '../config.js';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(''); setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) setMsg(data.message);
      else setError(data.message);
    } catch {
      setError('Unable to connect. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🌾 CropDesk</div>
        <h2>Forgot password?</h2>
        <p className="auth-subtitle">Enter your email and we'll send you a reset link</p>

        {error && <div className="auth-error">{error}</div>}
        {msg   && <div className="auth-success">{msg}</div>}

        {!msg && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your registered email" required />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          <Link to="/login">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

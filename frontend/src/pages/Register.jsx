import API_URL from '../config.js';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';

const fetchWithTimeout = async (url, options = {}, timeoutMs = 60000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ role: 'farmer', fname: '', lname: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: form.role, fname: form.fname, lname: form.lname, email: form.email, password: form.password })
      }, 65000);
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => navigate('/verify-email', { state: { email: form.email } }), 1500);
      } else {
        setError(data.message);
      }
    } catch (err) {
      if (err.name === 'AbortError') setError('Server is taking longer than usual. Please try again in a few seconds.');
      else setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🌾 CropDesk</div>
        <h2>Create account</h2>
        <p className="auth-subtitle">Join the farming marketplace</p>

        {error   && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>I am a</label>
            <select name="role" value={form.role} onChange={handleChange} required>
              <option value="farmer">Farmer</option>
              <option value="dealer">Dealer / Buyer</option>
            </select>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" name="fname" value={form.fname} onChange={handleChange} placeholder="First name" required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" name="lname" value={form.lname} onChange={handleChange} placeholder="Last name" required />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input type={showPassword ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required />
              <button type="button" className="toggle-pw" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" name="confirm" value={form.confirm}
              onChange={handleChange} placeholder="Repeat password" required />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

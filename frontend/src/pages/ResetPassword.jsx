import API_URL from '../config.js';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/reset-password/${token}/validate`)
      .then(r => r.json())
      .then(data => { setTokenValid(data.valid); setValidating(false); })
      .catch(() => { setTokenValid(false); setValidating(false); });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: form.password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Unable to connect. Please try again.');
    }
    setLoading(false);
  };

  if (validating) return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-subtitle">Validating reset link...</p>
      </div>
    </div>
  );

  if (!tokenValid) return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🌾 CropDesk</div>
        <h2>Link expired</h2>
        <div className="auth-error">This reset link is invalid or has expired.</div>
        <p className="auth-switch"><Link to="/forgot-password">Request a new link</Link></p>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🌾 CropDesk</div>
        <h2>Set new password</h2>
        <p className="auth-subtitle">Choose a strong password for your account</p>

        {error   && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success} Redirecting to login...</div>}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <div className="password-wrapper">
                <input type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters" required />
                <button type="button" className="toggle-pw" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="confirm" value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat new password" required />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

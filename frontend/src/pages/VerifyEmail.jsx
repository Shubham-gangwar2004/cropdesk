import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_URL from '../config.js';
import '../styles/Login.css';

const fetchWithTimeout = async (url, options = {}, timeoutMs = 45000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleInput = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0)
      inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the complete 6-digit code.'); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res  = await fetchWithTimeout(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code })
      }, 45000);
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setSuccess('Email verified! Redirecting...');
        setTimeout(() => navigate('/feed'), 1500);
      } else {
        setError(data.message);
        setOtp(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      }
    } catch (err) {
      if (err.name === 'AbortError') setError('Verification is taking longer than usual. Please try again.');
      else setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');
    try {
      const res  = await fetchWithTimeout(`${API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }, 45000);
      const data = await res.json();
      if (res.ok) { setSuccess('New code sent!'); setCountdown(60); setTimeout(() => setSuccess(''), 3000); }
      else setError(data.message);
    } catch (err) {
      if (err.name === 'AbortError') setError('Code resend is taking longer than usual. Please try again.');
      else setError('Failed to resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🌾 CropDesk</div>
        <h2>Verify your email</h2>
        <p className="auth-subtitle">
          We sent a 6-digit code to<br />
          <strong>{email}</strong>
        </p>

        {error   && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <div className="otp-inputs" onPaste={handlePaste}>
          {otp.map((d, i) => (
            <input
              key={i}
              ref={el => inputs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="otp-box"
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button className="auth-submit-btn" onClick={handleVerify} disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        <p className="auth-switch" style={{marginTop:'16px'}}>
          Didn't receive the code?{' '}
          {countdown > 0
            ? <span style={{color:'#95a5a6'}}>Resend in {countdown}s</span>
            : <button
                onClick={handleResend}
                disabled={resending}
                style={{background:'none',border:'none',color:'#27ae60',cursor:'pointer',fontWeight:600,fontSize:'0.9rem'}}
              >
                {resending ? 'Sending...' : 'Resend code'}
              </button>
          }
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;

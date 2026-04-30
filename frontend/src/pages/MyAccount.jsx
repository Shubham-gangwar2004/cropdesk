import API_URL from '../config.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MyAccount.css';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23c8d6c8'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23789878'/%3E%3Cellipse cx='50' cy='85' rx='28' ry='20' fill='%23789878'/%3E%3C/svg%3E";

const MyAccount = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setUser(data);
        setForm({
          fname: data.fname || '',
          lname: data.lname || '',
          phone: data.phone || '',
          bio: data.bio || '',
          profileImage: data.profileImage || '',
          street: data.address?.street || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          pincode: data.address?.pincode || '',
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load profile:', err);
        setLoading(false);
        setMsg(`Could not load profile: ${err.message}`);
      });
  }, [navigate]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, profileImage: reader.result }));
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fname: form.fname,
        lname: form.lname,
        phone: form.phone,
        bio: form.bio,
        profileImage: form.profileImage,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode }
      })
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      setMsg('Profile updated successfully.');
      window.dispatchEvent(new Event('profileUpdated'));
    } else {
      setMsg(data.message || 'Error updating profile.');
    }
    setSaving(false);
  };

  if (loading) return <div className="account-loading">Loading...</div>;
  if (!user) return <div className="account-loading">{msg || 'Failed to load profile.'}</div>;

  return (
    <div className="account-container">
      <div className="account-card">
        <h2>My Account</h2>

        <div className="avatar-section">
          <img
            src={form.profileImage || DEFAULT_AVATAR}
            alt="Profile"
            className="account-avatar"
          />
          <label className="avatar-upload-btn">
            Change Photo
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
          <span className="account-role">{user.role}</span>
        </div>

        {msg && <p className={`account-msg ${msg.includes('success') ? 'success' : 'error'}`}>{msg}</p>}

        <form onSubmit={handleSubmit}>
          <div className="account-section-title">Personal Info</div>
          <div className="account-row">
            <div className="account-field">
              <label>First Name</label>
              <input name="fname" value={form.fname} onChange={handleChange} required />
            </div>
            <div className="account-field">
              <label>Last Name</label>
              <input name="lname" value={form.lname} onChange={handleChange} required />
            </div>
          </div>
          <div className="account-row">
            <div className="account-field">
              <label>Email</label>
              <input value={user.email} disabled />
            </div>
            <div className="account-field">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
          <div className="account-field">
            <label>Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} placeholder="Tell buyers/farmers about yourself..." />
          </div>

          <div className="account-section-title">Address</div>
          <div className="account-field">
            <label>Street / Village</label>
            <input name="street" value={form.street} onChange={handleChange} placeholder="Street or village name" />
          </div>
          <div className="account-row">
            <div className="account-field">
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="City" />
            </div>
            <div className="account-field">
              <label>State</label>
              <input name="state" value={form.state} onChange={handleChange} placeholder="State" />
            </div>
            <div className="account-field">
              <label>Pincode</label>
              <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="Pincode" />
            </div>
          </div>

          <button type="submit" className="account-save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Change Password */}
        <div className="account-section-title" style={{marginTop:'32px'}}>Change Password</div>
        {pwMsg && <p className={`account-msg ${pwMsg.includes('success') ? 'success' : 'error'}`}>{pwMsg}</p>}
        <form onSubmit={async e => {
          e.preventDefault();
          if (pwForm.newPassword !== pwForm.confirm) { setPwMsg('Passwords do not match'); return; }
          if (pwForm.newPassword.length < 6) { setPwMsg('Password must be at least 6 characters'); return; }
          setPwSaving(true); setPwMsg('');
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/api/auth/change-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
          });
          const data = await res.json();
          setPwMsg(data.message);
          if (res.ok) setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
          setPwSaving(false);
        }}>
          <div className="account-field">
            <label>Current Password</label>
            <input type="password" value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Enter current password" required />
          </div>
          <div className="account-row">
            <div className="account-field">
              <label>New Password</label>
              <input type="password" value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Min. 6 characters" required />
            </div>
            <div className="account-field">
              <label>Confirm New Password</label>
              <input type="password" value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat new password" required />
            </div>
          </div>
          <button type="submit" className="account-save-btn" disabled={pwSaving}
            style={{background:'#3498db'}}>
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MyAccount;

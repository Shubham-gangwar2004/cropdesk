import API_URL from '../config.js';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Vegetables',
    price: '', quantity: '', unit: 'kg', quality: 'A',
    harvestDate: '', city: '', state: '', pincode: '', images: []
  });
  const [coords, setCoords]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [locLoading, setLocLoading]   = useState(false);
  const [locMsg, setLocMsg]           = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError]             = useState('');
  const [aiLoading, setAiLoading]     = useState(false);

  const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY;

  const handleGenerateDescription = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a Crop Title first so AI can generate a description.');
      return;
    }
    setAiLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ai/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title:    formData.title,
          category: formData.category,
          quality:  formData.quality,
          harvestDate: formData.harvestDate || null
        })
      });
      const data = await res.json();
      if (res.ok && data.description) {
        setFormData(f => ({ ...f, description: data.description }));
      } else {
        setError(data.message || 'AI did not return a response. Please try again.');
      }
    } catch {
      setError('Failed to generate description. Please try again.');
    }
    setAiLoading(false);
  };

  // City autocomplete
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [sugLoading, setSugLoading]           = useState(false);
  const sugDebounce   = useRef(null);
  const sugRef        = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = e => {
      if (sugRef.current && !sugRef.current.contains(e.target))
        setCitySuggestions([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchCitySuggestions = (query) => {
    if (query.length < 2) { setCitySuggestions([]); return; }
    setSugLoading(true);
    clearTimeout(sugDebounce.current);
    sugDebounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`
        );
        const data = await res.json();
        setCitySuggestions(data.map(item => ({
          short: item.display_name.split(',')[0],
          label: item.display_name.split(',').slice(0, 3).join(', '),
          city:    item.address?.city || item.address?.town || item.address?.village || item.address?.county || item.display_name.split(',')[0],
          state:   item.address?.state || '',
          pincode: item.address?.postcode || '',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        })));
      } catch { setCitySuggestions([]); }
      setSugLoading(false);
    }, 300);
  };

  const fetchApproxLocation = async () => {
    const res = await fetch('https://ipwho.is/?fields=success,city,region,postcode,latitude,longitude');
    const data = await res.json();

    if (!data?.success) {
      throw new Error('Approximate location lookup failed');
    }

    return {
      city: data.city || '',
      state: data.region || '',
      pincode: data.postcode || '',
      coords: {
        lat: Number(data.latitude),
        lng: Number(data.longitude)
      }
    };
  };

  const handleCityInput = e => {
    setFormData(f => ({ ...f, city: e.target.value }));
    fetchCitySuggestions(e.target.value);
  };

  const handleSelectCity = (sug) => {
    setFormData(f => ({
      ...f,
      city:    sug.city,
      state:   sug.state   || f.state,
      pincode: sug.pincode || f.pincode
    }));
    setCoords({ lat: sug.lat, lng: sug.lng });
    setCitySuggestions([]);
  };

  const handleChange = e => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAutoLocation = () => {
    setLocLoading(true);
    setLocMsg('Detecting your location...');

    const useApproxFallback = async (message) => {
      try {
        const fallback = await fetchApproxLocation();
        setCoords(fallback.coords);
        setFormData(f => ({
          ...f,
          city: fallback.city || f.city,
          state: fallback.state || f.state,
          pincode: fallback.pincode || f.pincode
        }));
        setLocMsg(message);
      } catch {
        setLocMsg(message);
      } finally {
        setLocLoading(false);
      }
    };

    if (!navigator.geolocation || !window.isSecureContext) {
      useApproxFallback('Precise location needs HTTPS, so using approximate city instead.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const a = data.address;
          setFormData(f => ({
            ...f,
            city:    a.city || a.town || a.village || a.county || '',
            state:   a.state || '',
            pincode: a.postcode || ''
          }));
          setLocMsg('✅ Location detected successfully');
        } catch {
          setLocMsg('⚠️ Could not fetch address details');
        }
        setLocLoading(false);
      },
      async () => { await useApproxFallback('Location permission denied, so using approximate city instead.'); },
      { timeout: 8000 }
    );
  };

  const handleImageUpload = e => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(p => [...p, reader.result]);
        setFormData(f => ({ ...f, images: [...f.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageRemove = i => {
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
    setFormData(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    try {
      const productData = {
        title: formData.title, description: formData.description,
        category: formData.category, price: Number(formData.price),
        quantity: Number(formData.quantity), unit: formData.unit,
        quality: formData.quality,
        harvestDate: formData.harvestDate || undefined,
        location: {
          city: formData.city, state: formData.state, pincode: formData.pincode,
          ...(coords ? { coordinates: coords } : {})
        },
        images: formData.images
      };

      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (res.ok) navigate('/my-listings');
      else setError(data.message || 'Error posting product');
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="add-product-container">
      <div className="add-product-form">
        <div className="form-title-row">
          <h2>🌾 Post Your Crop</h2>
          <p>Fill in the details below to list your crop on the marketplace</p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* Basic Info */}
          <div className="form-section-title">Basic Information</div>
          <div className="form-row">
            <div className="form-group">
              <label>Crop Title *</label>
              <input type="text" name="title" placeholder="e.g., Fresh Tomatoes"
                value={formData.title} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                {['Vegetables','Fruits','Grains','Pulses','Spices','Others'].map(c =>
                  <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          

          {/* Pricing */}
          <div className="form-section-title">Pricing & Quantity</div>
          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input type="number" name="price" placeholder="Price per unit"
                value={formData.price} onChange={handleChange} required min="0" />
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" name="quantity" placeholder="Available quantity"
                value={formData.quantity} onChange={handleChange} required min="0" />
            </div>
            <div className="form-group">
              <label>Unit *</label>
              <select name="unit" value={formData.unit} onChange={handleChange} required>
                <option value="kg">Kilogram (kg)</option>
                <option value="quintal">Quintal</option>
                <option value="ton">Ton</option>
                <option value="bag">Bag</option>
                <option value="piece">Piece</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quality Grade *</label>
              <select name="quality" value={formData.quality} onChange={handleChange} required>
                <option value="A">⭐ Grade A — Premium</option>
                <option value="B">✅ Grade B — Standard</option>
                <option value="C">🔵 Grade C — Economy</option>
              </select>
            </div>
            <div className="form-group">
              <label>Harvest Date</label>
              <input type="date" name="harvestDate" value={formData.harvestDate} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <div className="desc-label-row">
              <label>Description *</label>
              <button
                type="button"
                className="ai-gen-btn"
                onClick={handleGenerateDescription}
                disabled={aiLoading}
              >
                {aiLoading
                  ? <><span className="ai-spinner" /> Generating...</>
                  : <>✨ Generate with AI</>}
              </button>
            </div>
            <textarea name="description" placeholder="Describe your crop — freshness, farming method, etc."
              value={formData.description} onChange={handleChange} rows="4" required />
            {aiLoading && (
              <p className="ai-hint">AI is writing a description based on your crop title and category...</p>
            )}
          </div>

          {/* Location */}
          <div className="form-section-title">Location</div>
          <div className="location-auto-row">
            <button type="button" className="auto-loc-btn" onClick={handleAutoLocation} disabled={locLoading}>
              {locLoading ? '⏳ Detecting...' : '📡 Auto-detect my location'}
            </button>
            {locMsg && <span className="loc-msg">{locMsg}</span>}
          </div>

          <div className="form-row">
            <div className="form-group" ref={sugRef} style={{ position: 'relative' }}>
              <label>City *</label>
              <input
                type="text"
                name="city"
                placeholder="Type city or area..."
                value={formData.city}
                onChange={handleCityInput}
                autoComplete="off"
                required
              />
              {(citySuggestions.length > 0 || sugLoading) && (
                <div className="city-suggestions">
                  {sugLoading && <div className="city-sug-loading">Searching...</div>}
                  {citySuggestions.map((sug, i) => (
                    <button key={i} type="button" className="city-sug-item"
                      onClick={() => handleSelectCity(sug)}>
                      <span className="city-sug-icon">📍</span>
                      <span className="city-sug-text">
                        <span className="city-sug-main">{sug.city}</span>
                        <span className="city-sug-sub">{sug.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>State *</label>
              <input type="text" name="state" placeholder="State"
                value={formData.state} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Pincode</label>
              <input type="text" name="pincode" placeholder="Pincode"
                value={formData.pincode} onChange={handleChange} />
            </div>
          </div>

          {/* Images */}
          <div className="form-section-title">Product Images</div>
          <div className="image-upload-section">
            <label className="add-image-btn">
              📷 Upload Photos (Device / Camera)
              <input type="file" accept="image/*" multiple capture="environment"
                onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <p className="image-hint">Add clear photos to attract more buyers</p>
            {imagePreviews.length > 0 && (
              <div className="image-preview">
                {imagePreviews.map((img, i) => (
                  <div key={i} className="image-item">
                    <img src={img} alt={`Product ${i+1}`} />
                    <button type="button" onClick={() => handleImageRemove(i)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '⏳ Posting...' : '🚀 Post Crop'}
            </button>
            <button type="button" className="cancel-btn" onClick={() => navigate('/feed')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;

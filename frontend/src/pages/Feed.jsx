import API_URL from '../config.js';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Feed.css';

const FEED_LOCATION_STORAGE_KEY = 'cropdesk:feedLocation';
const FEED_RADIUS_STORAGE_KEY = 'cropdesk:feedRadius';

const RADIUS_OPTIONS = [
  { label: '50 km',     value: 50 },
  { label: '100 km',    value: 100 },
  { label: '250 km',    value: 250 },
  { label: '500 km',    value: 500 },
  { label: '1000 km',   value: 1000 },
  { label: 'All', value: 0 },
];

const Feed = () => {
  const navigate = useNavigate();
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [viewMode, setViewMode]         = useState('grid');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError]     = useState('');
  const [editingLocation, setEditingLocation] = useState(false);
  const [manualCity, setManualCity]     = useState('');
  const [suggestions, setSuggestions]   = useState([]);
  const [sugLoading, setSugLoading]     = useState(false);
  const [radius, setRadius]             = useState(() => {
    const savedRadius = Number(localStorage.getItem(FEED_RADIUS_STORAGE_KEY));
    return Number.isFinite(savedRadius) && savedRadius >= 0 ? savedRadius : 100;
  });
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [filters, setFilters]           = useState({
    category: '', minPrice: '', maxPrice: '',
    quality: '', search: '', sortBy: 'createdAt', order: 'desc'
  });

  const debounceRef     = useRef(null);
  const sugDebounce     = useRef(null);
  const sugContainerRef = useRef(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem(FEED_LOCATION_STORAGE_KEY);
      if (savedLocation) {
        const parsed = JSON.parse(savedLocation);
        if (Number.isFinite(parsed?.lat) && Number.isFinite(parsed?.lng) && parsed?.label) {
          setUserLocation(parsed);
          return;
        }
      }
    } catch {
      localStorage.removeItem(FEED_LOCATION_STORAGE_KEY);
    }

    detectLocation();
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    localStorage.setItem(FEED_LOCATION_STORAGE_KEY, JSON.stringify(userLocation));
  }, [userLocation]);

  useEffect(() => {
    localStorage.setItem(FEED_RADIUS_STORAGE_KEY, String(radius));
  }, [radius]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchProducts, 400);
  }, [filters, userLocation, radius]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = e => {
      if (sugContainerRef.current && !sugContainerRef.current.contains(e.target))
        setSuggestions([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Location helpers ──────────────────────────────────────────────────────
  const fetchApproxLocation = async () => {
    const res = await fetch('https://ipwho.is/?fields=success,city,region,latitude,longitude');
    const data = await res.json();

    if (!data?.success) {
      throw new Error('Approximate location lookup failed');
    }

    return {
      lat: Number(data.latitude),
      lng: Number(data.longitude),
      label: data.city || data.region || 'Your location'
    };
  };

  const detectLocation = () => {
    setLocationLoading(true);
    setLocationError('');

    const useApproxFallback = async (message) => {
      try {
        const fallback = await fetchApproxLocation();
        setUserLocation(fallback);
        setLocationError(message);
        setEditingLocation(false);
      } catch {
        setLocationError(message);
      } finally {
        setLocationLoading(false);
      }
    };

    if (!navigator.geolocation || !window.isSecureContext) {
      useApproxFallback('Precise location needs HTTPS, so using approximate city instead.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const label = await reverseGeocode(lat, lng);
        setUserLocation({ lat, lng, label });
        setLocationLoading(false);
        setEditingLocation(false);
      },
      async () => {
        await useApproxFallback('Location permission denied, so using approximate city instead.');
      },
      { timeout: 8000 }
    );
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      const a    = data.address;
      return a.city || a.town || a.village || a.county || a.state || 'Your location';
    } catch { return 'Your location'; }
  };

  // Live autocomplete from Nominatim
  const fetchSuggestions = (query) => {
    if (query.length < 2) { setSuggestions([]); return; }
    setSugLoading(true);
    clearTimeout(sugDebounce.current);
    sugDebounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`
        );
        const data = await res.json();
        setSuggestions(data.map(item => ({
          label: item.display_name.split(',').slice(0, 3).join(', '),
          short: item.display_name.split(',')[0],
          lat:   parseFloat(item.lat),
          lng:   parseFloat(item.lon),
          type:  item.type
        })));
      } catch { setSuggestions([]); }
      setSugLoading(false);
    }, 300);
  };

  const handleManualInput = e => {
    setManualCity(e.target.value);
    fetchSuggestions(e.target.value);
  };

  const handleSelectSuggestion = (sug) => {
    setUserLocation({ lat: sug.lat, lng: sug.lng, label: sug.short });
    setManualCity('');
    setSuggestions([]);
    setEditingLocation(false);
    setLocationError('');
  };

  // ── Products ──────────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      if (userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
        params.append('radius', radius);
      }
      const res  = await fetch(`${API_URL}/api/products?${params}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setProducts([]);
    }
    setLoading(false);
  };

  const handleFilterChange = e => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  const clearFilters = () => setFilters({
    category: '', minPrice: '', maxPrice: '', quality: '', search: '', sortBy: 'createdAt', order: 'desc'
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="feed-container">

      {/* Location Bar */}
      <div className="location-bar">
        <div className="location-bar-left">
          <span className="loc-pin">📍</span>

          {locationLoading ? (
            <span className="loc-text muted">Detecting location...</span>
          ) : editingLocation ? (
            <div className="loc-edit-wrapper" ref={sugContainerRef}>
              <div className="loc-edit-row">
                <input
                  className="loc-input"
                  placeholder="Search city, area, pincode..."
                  value={manualCity}
                  onChange={handleManualInput}
                  autoFocus
                />
                <button
                  className="loc-gps-btn"
                  title="Use my current location"
                  onClick={detectLocation}
                  disabled={locationLoading}
                >
                  📡
                </button>
                <button className="loc-cancel-btn" onClick={() => { setEditingLocation(false); setSuggestions([]); setManualCity(''); }}>✕</button>
              </div>

              {/* Suggestions dropdown */}
              {(suggestions.length > 0 || sugLoading) && (
                <div className="loc-suggestions">
                  {sugLoading && <div className="sug-loading">Searching...</div>}
                  {suggestions.map((sug, i) => (
                    <button key={i} className="sug-item" onClick={() => handleSelectSuggestion(sug)}>
                      <span className="sug-icon">📍</span>
                      <span className="sug-text">
                        <span className="sug-main">{sug.short}</span>
                        <span className="sug-sub">{sug.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button className="loc-text-btn" onClick={() => setEditingLocation(true)}>
              <span className="loc-text">{userLocation?.label || 'Set location'}</span>
              <span className="loc-change">▾ change</span>
            </button>
          )}

          {locationError && !editingLocation && (
            <span className="loc-error">{locationError}</span>
          )}
          {!locationLoading && !userLocation && !editingLocation && (
            <button className="loc-detect-btn" onClick={detectLocation}>📡 Detect my location</button>
          )}
        </div>

        <div className="location-bar-right">
          <span className="radius-label">Radius:</span>
          <div className="radius-pills">
            {RADIUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`radius-pill ${radius === opt.value ? 'active' : ''}`}
                onClick={() => setRadius(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="feed-header">
        <div>
          <h1>Marketplace</h1>
          <p className="feed-subtitle">
            {userLocation && radius > 0
              ? `Fresh crops within ${radius} km of ${userLocation.label}`
              : 'All crops across India'}
          </p>
        </div>
      </div>

      <div className="feed-content">
        {/* Sidebar */}
        <aside className={`filters-sidebar ${filtersOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <h3>🔍 Filters</h3>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              <button className="clear-filters-btn" onClick={clearFilters}>Clear</button>
              <button className="sidebar-close-btn" onClick={() => setFiltersOpen(false)}>✕</button>
            </div>
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input type="text" name="search" placeholder="Search crops..."
              value={filters.search} onChange={handleFilterChange} />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {['Vegetables','Fruits','Grains','Pulses','Spices','Others'].map(c =>
                <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Price Range (₹)</label>
            <div className="price-range-row">
              <input type="number" name="minPrice" placeholder="Min"
                value={filters.minPrice} onChange={handleFilterChange} />
              <span>—</span>
              <input type="number" name="maxPrice" placeholder="Max"
                value={filters.maxPrice} onChange={handleFilterChange} />
            </div>
          </div>

          <div className="filter-group">
            <label>Quality Grade</label>
            <select name="quality" value={filters.quality} onChange={handleFilterChange}>
              <option value="">All Qualities</option>
              <option value="A">⭐ Grade A — Premium</option>
              <option value="B">✅ Grade B — Standard</option>
              <option value="C">� Grade C — Economy</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="createdAt">🕐 Date Posted</option>
              <option value="price">� Price</option>
              <option value="views">🔥 Popular</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Order</label>
            <select name="order" value={filters.order} onChange={handleFilterChange}>
              <option value="desc">↓ Descending</option>
              <option value="asc">↑ Ascending</option>
            </select>
          </div>
        </aside>

        {/* Products */}
        <main className="products-section">
          {/* Mobile search + filter toggle */}
          <div className="mobile-filter-bar">
            <input
              type="text"
              name="search"
              className="mobile-search-input"
              placeholder="🔍 Search crops..."
              value={filters.search}
              onChange={handleFilterChange}
            />
            <button className="mobile-filter-btn" onClick={() => setFiltersOpen(v => !v)}>
              ⚙️ Filters
              {(filters.category || filters.quality || filters.minPrice || filters.maxPrice) && (
                <span className="filter-dot" />
              )}
            </button>
          </div>
          {filtersOpen && <div className="filters-overlay" onClick={() => setFiltersOpen(false)} />}
          {loading ? (
            <div className="feed-loading">
              <div className="spinner" />
              <p>Finding crops near you...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <div className="no-products-icon">🌾</div>
              <h3>No crops found</h3>
              <p>Try increasing the radius or clearing filters</p>
              <button onClick={() => { clearFilters(); setRadius(0); }}>Show all crops</button>
            </div>
          ) : (
            <div className={`products-${viewMode}`}>
              {products.map(product => (
                <div key={product._id} className="product-card"
                  onClick={() => navigate(`/product/${product._id}`)}>
                  <div className="product-image">
                    <img
                      src={product.images?.[0] || `https://placehold.co/300x200/e8f5e9/27ae60?text=${encodeURIComponent(product.title)}`}
                      alt={product.title}
                      onError={e => { e.target.src = `https://placehold.co/300x200/e8f5e9/27ae60?text=${encodeURIComponent(product.title)}`; }}
                    />
                    <span className={`quality-badge grade-${product.quality?.toLowerCase()}`}>
                      Grade {product.quality}
                    </span>
                    {product.distance != null && (
                      <span className="distance-badge">📍 {product.distance} km</span>
                    )}
                  </div>
                  <div className="product-info">
                    <div className="product-category-tag">{product.category}</div>
                    <h3>{product.title}</h3>
                    <p className="price">₹{product.price}<span className="unit-label">/{product.unit}</span></p>
                    <p className="quantity">📦 {product.quantity} {product.unit} available</p>
                    <p className="location">📍 {product.location?.city}, {product.location?.state}</p>
                    <div className="product-footer">
                      <span className="seller-name">👤 {product.seller?.fname} {product.seller?.lname}</span>
                      <span className="views-count">👁 {product.views}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Feed;

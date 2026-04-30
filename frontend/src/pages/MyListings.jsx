import API_URL from '../config.js';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MyListings.css';

const MyListings = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    category: 'Vegetables',
    description: '',
    price: '',
    quantity: '',
    unit: 'kg',
    quality: 'A',
    harvestDate: '',
    city: '',
    state: '',
    pincode: '',
    status: 'available'
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editLocLoading, setEditLocLoading] = useState(false);
  const [editLocMsg, setEditLocMsg] = useState('');
  const [editCitySuggestions, setEditCitySuggestions] = useState([]);
  const [editSugLoading, setEditSugLoading] = useState(false);
  const [editCoords, setEditCoords] = useState(null);
  const editSugDebounce = useRef(null);
  const editSugRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      navigate('/login');
      return;
    }
    fetchMyProducts();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (editSugRef.current && !editSugRef.current.contains(e.target)) {
        setEditCitySuggestions([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchMyProducts = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/products/user/my-products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setLoading(false);
  };

  const toInputDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setEditLocMsg('');
    setEditCitySuggestions([]);
    setEditCoords(product.location?.coordinates || null);
    setEditForm({
      title: product.title || '',
      category: product.category || 'Vegetables',
      description: product.description || '',
      price: product.price ?? '',
      quantity: product.quantity ?? '',
      unit: product.unit || 'kg',
      quality: product.quality || 'A',
      harvestDate: toInputDate(product.harvestDate),
      city: product.location?.city || '',
      state: product.location?.state || '',
      pincode: product.location?.pincode || '',
      status: product.status || 'available'
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  };

  const fetchEditCitySuggestions = (query) => {
    if (query.length < 2) {
      setEditCitySuggestions([]);
      return;
    }

    setEditSugLoading(true);
    clearTimeout(editSugDebounce.current);
    editSugDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`
        );
        const data = await res.json();
        setEditCitySuggestions(data.map(item => ({
          city: item.address?.city || item.address?.town || item.address?.village || item.address?.county || item.display_name.split(',')[0],
          state: item.address?.state || '',
          pincode: item.address?.postcode || '',
          label: item.display_name.split(',').slice(0, 3).join(', '),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        })));
      } catch {
        setEditCitySuggestions([]);
      }
      setEditSugLoading(false);
    }, 300);
  };

  const handleEditCityInput = (e) => {
    const value = e.target.value;
    setEditForm(f => ({ ...f, city: value }));
    fetchEditCitySuggestions(value);
  };

  const handleSelectEditCity = (sug) => {
    setEditForm(f => ({
      ...f,
      city: sug.city,
      state: sug.state || f.state,
      pincode: sug.pincode || f.pincode
    }));
    if (!Number.isNaN(sug.lat) && !Number.isNaN(sug.lng)) {
      setEditCoords({ lat: sug.lat, lng: sug.lng });
    }
    setEditCitySuggestions([]);
  };

  const fetchApproxLocation = async () => {
    const res = await fetch('https://ipwho.is/?fields=success,city,region,postcode,latitude,longitude');
    const data = await res.json();
    if (!data?.success) throw new Error('Location lookup failed');
    return {
      city: data.city || '',
      state: data.region || '',
      pincode: data.postcode || '',
      coordinates: {
        lat: Number(data.latitude),
        lng: Number(data.longitude)
      }
    };
  };

  const handleEditAutoLocation = () => {
    setEditLocLoading(true);
    setEditLocMsg('Detecting your location...');

    const useApproxFallback = async (message) => {
      try {
        const fallback = await fetchApproxLocation();
        setEditForm(f => ({
          ...f,
          city: fallback.city || f.city,
          state: fallback.state || f.state,
          pincode: fallback.pincode || f.pincode
        }));
        if (!Number.isNaN(fallback.coordinates?.lat) && !Number.isNaN(fallback.coordinates?.lng)) {
          setEditCoords(fallback.coordinates);
        }
        setEditLocMsg(message);
      } catch {
        setEditLocMsg('Could not detect location. Enter city manually.');
      } finally {
        setEditLocLoading(false);
      }
    };

    if (!navigator.geolocation || !window.isSecureContext) {
      useApproxFallback('Using approximate location from network.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const a = data.address || {};
          setEditForm(f => ({
            ...f,
            city: a.city || a.town || a.village || a.county || f.city,
            state: a.state || f.state,
            pincode: a.postcode || f.pincode
          }));
          setEditCoords({ lat, lng });
          setEditLocMsg('Location detected successfully.');
        } catch {
          await useApproxFallback('Using approximate location from network.');
          return;
        }
        setEditLocLoading(false);
      },
      async () => {
        await useApproxFallback('Location permission denied, using approximate location.');
      },
      { timeout: 8000 }
    );
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const token = localStorage.getItem('token');
    setEditSaving(true);

    try {
      const payload = {
        title: editForm.title,
        category: editForm.category,
        description: editForm.description,
        price: Number(editForm.price),
        quantity: Number(editForm.quantity),
        unit: editForm.unit,
        quality: editForm.quality,
        status: editForm.status,
        harvestDate: editForm.harvestDate || undefined,
        location: {
          city: editForm.city,
          state: editForm.state,
          pincode: editForm.pincode,
          ...(editCoords ? { coordinates: editCoords } : {})
        }
      };

      const res = await fetch(`${API_URL}/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        alert('Product updated successfully');
        setEditingProduct(null);
        fetchMyProducts();
      } else {
        alert(data.message || 'Error updating product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product');
    }

    setEditSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('Product deleted successfully');
        fetchMyProducts();
      } else {
        alert('Error deleting product');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting product');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        alert('Status updated successfully');
        fetchMyProducts();
      } else {
        alert('Error updating status');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating status');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="my-listings-container">
      <div className="listings-header">
        <h1>My Listings</h1>
        <button className="add-product-btn" onClick={() => navigate('/add-product')}>
          + Add New Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="no-listings">
          <p>You haven't posted any products yet</p>
          <button onClick={() => navigate('/add-product')}>Post Your First Product</button>
        </div>
      ) : (
        <div className="listings-grid">
          {products.map(product => (
            <div key={product._id} className="listing-card">
              <div className="listing-image">
                <img 
                  src={product.images && product.images[0] 
                    ? product.images[0] 
                    : 'https://via.placeholder.com/300x200?text=No+Image'} 
                  alt={product.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                  }}
                />
                <span className={`status-badge ${product.status}`}>
                  {product.status}
                </span>
              </div>

              <div className="listing-info">
                <h3>{product.title}</h3>
                <p className="category">{product.category}</p>
                <p className="price">₹{product.price}/{product.unit}</p>
                <p className="quantity">Quantity: {product.quantity} {product.unit}</p>
                <p className="location">📍 {product.location?.city}, {product.location?.state}</p>
                
                <div className="listing-stats">
                  <span>👁 {product.views} views</span>
                  <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="listing-actions">
                  <button 
                    className="view-btn"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    View
                  </button>

                  <button
                    className="listing-edit-btn"
                    onClick={() => handleOpenEdit(product)}
                  >
                    Edit
                  </button>
                  
                  <select 
                    value={product.status} 
                    onChange={(e) => handleStatusChange(product._id, e.target.value)}
                    className="status-select"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>

                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(product._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingProduct && (
        <div className="edit-modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Listing</h2>
            <p className="edit-subtitle">Update quantity, location, status, or any listing detail.</p>

            <form className="listing-edit-form" onSubmit={handleSaveEdit}>
              <div className="edit-location-auto-row">
                <button type="button" className="edit-auto-loc-btn" onClick={handleEditAutoLocation} disabled={editLocLoading}>
                  {editLocLoading ? 'Detecting...' : 'Auto-detect location'}
                </button>
                {editLocMsg && <span className="edit-loc-msg">{editLocMsg}</span>}
              </div>

              <div className="edit-grid two-col">
                <div className="edit-field">
                  <label>Crop Title</label>
                  <input name="title" value={editForm.title} onChange={handleEditChange} required />
                </div>
                <div className="edit-field">
                  <label>Category</label>
                  <select name="category" value={editForm.category} onChange={handleEditChange} required>
                    {['Vegetables','Fruits','Grains','Pulses','Spices','Others'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="edit-field">
                <label>Description</label>
                <textarea name="description" rows={3} value={editForm.description} onChange={handleEditChange} required />
              </div>

              <div className="edit-grid three-col">
                <div className="edit-field">
                  <label>Price</label>
                  <input type="number" min="0" name="price" value={editForm.price} onChange={handleEditChange} required />
                </div>
                <div className="edit-field">
                  <label>Quantity</label>
                  <input type="number" min="0" name="quantity" value={editForm.quantity} onChange={handleEditChange} required />
                </div>
                <div className="edit-field">
                  <label>Unit</label>
                  <select name="unit" value={editForm.unit} onChange={handleEditChange} required>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="quintal">Quintal</option>
                    <option value="ton">Ton</option>
                    <option value="bag">Bag</option>
                    <option value="piece">Piece</option>
                  </select>
                </div>
              </div>

              <div className="edit-grid three-col">
                <div className="edit-field">
                  <label>Quality</label>
                  <select name="quality" value={editForm.quality} onChange={handleEditChange} required>
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>
                </div>
                <div className="edit-field">
                  <label>Harvest Date</label>
                  <input type="date" name="harvestDate" value={editForm.harvestDate} onChange={handleEditChange} />
                </div>
                <div className="edit-field">
                  <label>Status</label>
                  <select name="status" value={editForm.status} onChange={handleEditChange} required>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <div className="edit-grid three-col">
                <div className="edit-field" ref={editSugRef} style={{ position: 'relative' }}>
                  <label>City</label>
                  <input name="city" value={editForm.city} onChange={handleEditCityInput} autoComplete="off" required />
                  {(editCitySuggestions.length > 0 || editSugLoading) && (
                    <div className="edit-city-suggestions">
                      {editSugLoading && <div className="edit-city-loading">Searching...</div>}
                      {editCitySuggestions.map((sug, i) => (
                        <button type="button" key={i} className="edit-city-item" onClick={() => handleSelectEditCity(sug)}>
                          <span className="edit-city-main">{sug.city}</span>
                          <span className="edit-city-sub">{sug.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="edit-field">
                  <label>State</label>
                  <input name="state" value={editForm.state} onChange={handleEditChange} required />
                </div>
                <div className="edit-field">
                  <label>Pincode</label>
                  <input name="pincode" value={editForm.pincode} onChange={handleEditChange} />
                </div>
              </div>

              <div className="edit-actions">
                <button type="button" className="cancel-edit-btn" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="save-edit-btn" disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;
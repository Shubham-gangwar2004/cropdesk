import API_URL from '../config.js';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState({ sameFarmer: [], nearby: [] });
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [recommendationError, setRecommendationError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
      } catch {}
    }
    setCurrentImageIndex(0);
    fetchProduct();
    fetchRecommendations();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`);
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    setRecommendationLoading(true);
    setRecommendationError('');
    try {
      const res = await fetch(`${API_URL}/api/products/${id}/recommendations`);
      if (!res.ok) {
        throw new Error(`Recommendation API failed (${res.status})`);
      }
      const data = await res.json();
      setRecommendations({
        sameFarmer: Array.isArray(data.sameFarmer) ? data.sameFarmer : [],
        nearby: Array.isArray(data.nearby) ? data.nearby : []
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendationError('Unable to load suggestions right now. Please refresh after backend restart.');
      setRecommendations({ sameFarmer: [], nearby: [] });
    }
    setRecommendationLoading(false);
  };

  const handleContactSeller = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please login to contact seller');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: product.seller._id,
          productId: product._id
        })
      });

      const data = await res.json();
      navigate(`/chat/${data._id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error starting chat');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!product) {
    return <div className="error-container">Product not found</div>;
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://via.placeholder.com/600x400?text=No+Image'];

  const renderRecommendationCard = (item, reason) => (
    <button
      key={`${reason}-${item._id}`}
      className="recommendation-card"
      onClick={() => navigate(`/product/${item._id}`)}
    >
      <div className="recommendation-image">
        <img
          src={item.images?.[0] || `https://placehold.co/300x200/e8f5e9/27ae60?text=${encodeURIComponent(item.title)}`}
          alt={item.title}
          onError={(e) => {
            e.target.src = `https://placehold.co/300x200/e8f5e9/27ae60?text=${encodeURIComponent(item.title)}`;
          }}
        />
      </div>
      <div className="recommendation-content">
        <p className="recommendation-category">{item.category}</p>
        <h4>{item.title}</h4>
        <p className="recommendation-price">₹{item.price}<span>/{item.unit}</span></p>
        <p className="recommendation-meta">📍 {item.location?.city || 'Unknown'}, {item.location?.state || 'Unknown'}</p>
        <p className="recommendation-meta">👤 {item.seller?.fname} {item.seller?.lname}</p>
        {item.distance != null && <p className="recommendation-distance">{item.distance} km away</p>}
      </div>
    </button>
  );

  return (
    <div className="product-details-container">
      <button className="back-btn" onClick={() => navigate('/feed')}>
        ← Back to Marketplace
      </button>

      <div className="product-details-content">
        <div className="product-images-section">
          <div className="main-image">
            <img src={images[currentImageIndex]} alt={product.title} />
          </div>
          {images.length > 1 && (
            <div className="image-thumbnails">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${product.title} ${index + 1}`}
                  className={currentImageIndex === index ? 'active' : ''}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="product-info-section">
          <div className="product-header">
            <h1>{product.title}</h1>
            <span className="quality-badge-large">Grade {product.quality}</span>
          </div>

          <div className="product-price">
            <span className="price">₹{product.price}</span>
            <span className="unit">per {product.unit}</span>
          </div>

          <div className="product-meta">
            <div className="meta-item">
              <strong>Category:</strong> {product.category}
            </div>
            <div className="meta-item">
              <strong>Available Quantity:</strong> {product.quantity} {product.unit}
            </div>
            <div className="meta-item">
              <strong>Status:</strong> {product.status}
            </div>
            {product.harvestDate && (
              <div className="meta-item">
                <strong>Harvest Date:</strong> {new Date(product.harvestDate).toLocaleDateString()}
              </div>
            )}
            <div className="meta-item">
              <strong>Views:</strong> {product.views}
            </div>
            <div className="meta-item">
              <strong>Posted:</strong> {new Date(product.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="product-location">
            <h3>Location</h3>
            <p>📍 {product.location?.city}, {product.location?.state}</p>
            {product.location?.pincode && <p>Pincode: {product.location.pincode}</p>}
          </div>

          <div className="seller-info">
            <h3>Seller Information</h3>
            <div className="seller-details">
              <p><strong>Name:</strong> {product.seller?.fname} {product.seller?.lname}</p>
              <p><strong>Role:</strong> {product.seller?.role}</p>
              <p><strong>Email:</strong> {product.seller?.email}</p>
            </div>
          </div>

          <div className="action-buttons">
            {currentUserId !== product.seller?._id && (
              <button className="contact-btn" onClick={handleContactSeller}>
                💬 Contact Seller
              </button>
            )}
            <button className="share-btn" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
            }}>
              🔗 Share
            </button>
          </div>
        </div>
      </div>

      <section className="recommendations-section">
        <div className="recommendations-header">
          <h2>Crops you might also like</h2>
        </div>

        {recommendationLoading ? (
          <div className="recommendations-loading">Finding relevant crops...</div>
        ) : recommendationError ? (
          <div className="recommendations-empty">{recommendationError}</div>
        ) : (
          <>
            {recommendations.sameFarmer.length > 0 && (
              <div className="recommendation-group">
                <h3>More crops from this farmer</h3>
                <div className="recommendation-grid">
                  {recommendations.sameFarmer.map((item) => renderRecommendationCard(item, 'same-farmer'))}
                </div>
              </div>
            )}

            {recommendations.nearby.length > 0 && (
              <div className="recommendation-group">
                <h3>Nearby crops in similar location</h3>
                <div className="recommendation-grid">
                  {recommendations.nearby.map((item) => renderRecommendationCard(item, 'nearby'))}
                </div>
              </div>
            )}

            {recommendations.sameFarmer.length === 0 && recommendations.nearby.length === 0 && (
              <div className="recommendations-empty">No similar crops available right now.</div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ProductDetails;
const rawApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
const devFallbackUrl = `${window.location.protocol}//${window.location.hostname}:5000`;

const API_URL = rawApiUrl || (import.meta.env.DEV ? devFallbackUrl : window.location.origin);

export default API_URL;

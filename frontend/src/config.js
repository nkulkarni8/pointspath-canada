// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔗 API URL:', API_URL);
  console.log('🏗️  Environment:', import.meta.env.MODE);
}

export { API_URL };
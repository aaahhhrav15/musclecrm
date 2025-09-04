// API Configuration
export const API_URL = `${import.meta.env.VITE_API_URL}/api`;

// Public S3 bucket base URL (e.g., https://your-bucket.s3.amazonaws.com)
export const S3_BUCKET_URL = import.meta.env.VITE_S3_BUCKET_URL as string;

// Other configuration settings can be added here
export const APP_CONFIG = {
  name: 'MuscleCRM',
  version: '1.0.0',
  // Add more configuration as needed
}; 
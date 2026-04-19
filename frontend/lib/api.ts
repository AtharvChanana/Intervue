/**
 * Simple API client for the Spring Boot backend.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(typeof FormData !== 'undefined' && options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Example: Attach token from localStorage if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token === 'undefined' || token === 'null') {
      localStorage.removeItem('token');
    } else if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }

    const text = await response.text();
    let errorMsg = 'API request failed';
    try {
      const parsed = JSON.parse(text);
      errorMsg = parsed.message || parsed.error || errorMsg;
    } catch (e) {
      // JSON parse failed, likely unhandled 500 error HTML dump
    }
    throw new Error(errorMsg);
  }

  // Handle No Content
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;
  
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

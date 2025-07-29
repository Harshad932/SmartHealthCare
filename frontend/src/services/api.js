// client/src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

export const doshaAPI = {
  // Get the initial question
  getInitialQuestion: async () => {
    try {
      const response = await api.get('/dosha/initial-question');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch initial question');
    }
  },

  // Get the next question based on previous answers
  getNextQuestion: async (answers, currentQuestionNumber) => {
    try {
      const response = await api.post('/dosha/next-question', {
        answers,
        currentQuestionNumber,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch next question');
    }
  },

  // Analyze dosha type based on all answers
  analyzeDoshaType: async (answers) => {
    try {
      const response = await api.post('/dosha/analyze', {
        answers,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to analyze dosha type');
    }
  },
};

export default api;
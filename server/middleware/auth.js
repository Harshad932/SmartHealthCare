import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Middleware to authenticate JWT tokens
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
};

// Middleware to check if user is a patient
export const requirePatient = (req, res, next) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({
      error: 'Access denied. Patient role required.'
    });
  }
  next();
};

// Middleware to check if user is a doctor
export const requireDoctor = (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({
      error: 'Access denied. Doctor role required.'
    });
  }
  next();
};

// Middleware to check if user is an admin
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Access denied. Admin role required.'
    });
  }
  next();
};
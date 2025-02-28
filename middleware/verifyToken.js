import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'No token provided or invalid format',
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded._id;

    next(); // Proceed to the next middleware or route handler
    // return res.status(403).json({
    //   message: 'Token expired. Please login again.',
    // });
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.name === 'TokenExpiredError') {
      // Token has expired
      return res.status(403).json({
        message: 'Token expired. Please login again.',
        error: error.message,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      // Invalid token
      return res.status(403).json({
        message: 'Invalid token. Authentication failed.',
        error: error.message,
      });
    }

    // Other unexpected errors
    return res.status(500).json({
      message: 'Error checking user',
      error: error.message,
    });
  }
};

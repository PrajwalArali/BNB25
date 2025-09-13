const { verifyToken } = require('@clerk/backend');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }


    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.metadata?.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const isAdmin = req.user.email?.includes('admin') || req.user.role === 'admin';
  
  if (!isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};

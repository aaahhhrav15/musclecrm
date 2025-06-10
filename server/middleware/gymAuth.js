const User = require('../models/User');

const gymAuth = async (req, res, next) => {
  try {
    // Get the user from the request (assuming you have auth middleware that sets req.user)
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.industry !== 'gym') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Not a gym user.' 
      });
    }

    if (!user.gymId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No gym associated with this user' 
      });
    }

    // Add gymId to the request for use in routes
    req.gymId = user.gymId;
    next();
  } catch (error) {
    console.error('Gym auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = { gymAuth }; 
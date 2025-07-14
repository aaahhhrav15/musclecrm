const Gym = require('../models/Gym');

function isSubscriptionActive(gym) {
  if (!gym.subscriptionEndDate) return false;
  return new Date(gym.subscriptionEndDate) >= new Date();
}

module.exports = async function checkSubscription(req, res, next) {
  // Try to get gymId from all possible places
  const gymId =
    req.gymId ||
    (req.user && req.user.gymId) ||
    (req.user && req.user.gym && req.user.gym._id) ||
    (req.gym && req.gym._id);

  if (!gymId) return next(); // If no gymId, skip check (e.g., for non-gym routes)

  try {
    const gym = await Gym.findById(gymId).lean();
    if (!gym || !isSubscriptionActive(gym)) {
      // Instead of error, send a special response
      return res.status(200).json({ redirectToSubscription: true });
    }
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}; 
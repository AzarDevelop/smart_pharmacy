const Notification = require('../models/Notification');

// Small helper so controllers can create a notification in one line
const notify = async ({ user, title, message, type = 'system', link = '' }) => {
  try {
    await Notification.create({ user, title, message, type, link });
  } catch (error) {
    // A failed notification should never break the main request
    console.error('Notification error:', error.message);
  }
};

module.exports = notify;

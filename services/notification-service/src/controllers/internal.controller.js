import notificationService from '../services/notification.service.js';

const pushNotificationInternal = async (req, res) => {
  try {
    const { recipientId, senderId, type, content, metadata } = req.body;
    const notif = await notificationService.createAndPush({ recipientId, senderId, type, content, metadata });
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const pushNotificationToAdminsInternal = async (req, res) => {
  try {
    const { senderId, type, content, metadata } = req.body;
    const notifs = await notificationService.notifyAllAdmins({ senderId, type, content, metadata });
    res.status(201).json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateNotificationContentInternal = async (req, res) => {
  try {
    const { recipientId, metadataQuery, updateData } = req.body;
    const notif = await notificationService.updateNotificationContent(recipientId, metadataQuery, updateData);
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export {
  pushNotificationInternal,
  pushNotificationToAdminsInternal,
  updateNotificationContentInternal
};

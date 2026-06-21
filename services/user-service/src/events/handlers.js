import { EventTypes } from './eventTypes.js';
import User from '../entities/User.js';

export const registerEventHandlers = (eventBus) => {
  // Khi Auth Service tạo user mới → tạo full profile trong User Service DB
  eventBus.subscribe(EventTypes.USER_CREATED, async (payload) => {
    try {
      console.log(`📩 [User Service] Handling USER_CREATED for user: ${payload.userId}`);
      
      const existingUser = await User.findById(payload.userId);
      if (existingUser) {
        console.log(`⚠️ [User Service] User already exists: ${payload.userId}`);
        return;
      }

      await User.create({
        _id: payload.userId,
        email: payload.email,
        profile: {
          fullName: payload.profile?.fullName,
          avatar: payload.profile?.avatar || 'default_avatar.png',
          country: payload.profile?.country
        },
        role: payload.role || 'user',
        statusAccount: payload.statusAccount || 'active',
        status: 'idle',
        settings: {
          theme: 'light',
          uiLanguage: 'en'
        },
        stats: {
          streak: 0,
          totalHours: 0,
          totalSessions: 0,
          learningCalendar: []
        }
      });
      console.log(`✅ [User Service] Created User profile for: ${payload.userId}`);
    } catch (err) {
      console.error(`❌ [User Service] Error in USER_CREATED handler:`, err.message);
    }
  });

  // Khi Match kết thúc → cập nhật stats
  eventBus.subscribe(EventTypes.MATCH_ENDED, async (payload) => {
    try {
      const { participants, durationSeconds, endedAt } = payload;
      console.log(`📩 [User Service] Handling MATCH_ENDED for participants: [${participants?.join(', ')}]`);

      if (!participants || participants.length === 0) return;

      const durationHours = (durationSeconds || 0) / 3600;
      const sessionEndTime = endedAt ? new Date(endedAt) : new Date();

      const getVnDateStr = (date) => {
        const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0];
      };

      const dateStr = getVnDateStr(sessionEndTime);

      if (durationSeconds > 0) {
        const users = await User.find({ _id: { $in: participants } });
        const yesterdayStr = getVnDateStr(new Date(sessionEndTime.getTime() - 24 * 60 * 60 * 1000));
        const bulkOps = [];

        for (const p of users) {
          if (!p.stats) p.stats = { streak: 0, totalSessions: 0, totalHours: 0, learningCalendar: [] };
          const lastUpdateStr = p.stats.lastStreakUpdate ? getVnDateStr(p.stats.lastStreakUpdate) : null;
          let newStreak = p.stats.streak || 0;

          if (lastUpdateStr !== dateStr) {
            if (lastUpdateStr === yesterdayStr) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }

            bulkOps.push({
              updateOne: {
                filter: { _id: p._id },
                update: {
                  $set: {
                    'stats.streak': newStreak,
                    'stats.lastStreakUpdate': sessionEndTime,
                    status: 'idle' // reset status to idle
                  },
                  $inc: {
                    'stats.totalSessions': 1,
                    'stats.totalHours': durationHours
                  },
                  $addToSet: {
                    'stats.learningCalendar': dateStr
                  }
                }
              }
            });
          } else {
            bulkOps.push({
              updateOne: {
                filter: { _id: p._id },
                update: {
                  $set: {
                    status: 'idle' // reset status to idle
                  },
                  $inc: {
                    'stats.totalSessions': 1,
                    'stats.totalHours': durationHours
                  },
                  $addToSet: {
                    'stats.learningCalendar': dateStr
                  }
                }
              }
            });
          }
        }

        if (bulkOps.length > 0) {
          await User.bulkWrite(bulkOps);
        }
      } else {
        // durationSeconds = 0, just increment sessions count and reset status to idle
        await User.updateMany(
          { _id: { $in: participants } },
          { 
            $set: { status: 'idle' },
            $inc: { 'stats.totalSessions': 1 } 
          }
        );
      }
      console.log(`✅ [User Service] Updated stats for participants`);
  });

  // Khi User offline → cập nhật lastOnlineAt và reset status về idle
  eventBus.subscribe(EventTypes.USER_OFFLINE, async (payload) => {
    try {
      const { userId, timestamp } = payload;
      console.log(`📩 [User Service] Handling USER_OFFLINE for user: ${userId}`);
      if (!userId) return;

      await User.findByIdAndUpdate(userId, {
        $set: {
          lastOnlineAt: timestamp ? new Date(timestamp) : new Date(),
          status: 'idle'
        }
      });
      console.log(`✅ [User Service] Updated lastOnlineAt and set idle status for: ${userId}`);
    } catch (err) {
      console.error(`❌ [User Service] Error in USER_OFFLINE handler:`, err.message);
    }
  });
};

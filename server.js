// server.js - Điểm khởi đầu ứng dụng
import app from './src/app.js';
import env from './src/config/env.js';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

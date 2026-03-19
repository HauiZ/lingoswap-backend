// tests/sample.test.js - Unit test ví dụ
/*
  Ví dụ test sử dụng Jest hoặc Mocha
  
  Cài đặt: npm install --save-dev jest
  Chạy: npm test
*/

const request = require('supertest');
const app = require('../src/app');

describe('API Tests', () => {
  
  test('GET / - Phải trả về 200 và message', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.body).toHaveProperty('message');
  });

  test('GET /api/users - Phải trả về danh sách users', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/users - Tạo user mới', async () => {
    const newUser = {
      name: 'Test User',
      email: 'test@example.com',
    };

    const response = await request(app)
      .post('/api/users')
      .send(newUser)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test User');
  });

});

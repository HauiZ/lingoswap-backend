const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  // Mật khẩu ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

const validateUsername = (username) => {
  // Username: 3-20 ký tự, chỉ chứa chữ, số, dấu gạch dưới, khoảng trắng
  const regex = /^[a-zA-Z0-9_ ]{3,20}$/;
  return regex.test(username);
};

export {
  validateEmail,
  validatePassword,
  validateUsername,
};

// test-verify.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = 'PASTE_THE_EXACT_TOKEN_HERE';
try {
  const payload = jwt.verify(token, process.env.JWT_RESET_SECRET);
  console.log('OK:', payload);
} catch (e) {
  console.log('FAIL:', e.name, e.message);
}


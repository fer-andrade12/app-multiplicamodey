const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  hashPassword,
  comparePassword,
};

import bcrypt from "bcrypt";
import authenticationConfig from "../../config/authentication.config.js";

const { saltRounds } = authenticationConfig.encryption;

function getHashedPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) reject(err);
      else {
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) reject(err);
          else resolve(hash);
        });
      }
    });
  });
}

function verifyPassword(inputPassword, storedPassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(inputPassword, storedPassword, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export { getHashedPassword, verifyPassword };

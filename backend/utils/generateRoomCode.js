const crypto = require("crypto");

// Room codes intentionally avoid visually confusing characters (0/O, 1/I/L)
// so they stay easy to read and type after being shared over WhatsApp etc.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

// crypto.randomInt is unbiased and unpredictable, unlike Math.random().
function generateRoomCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET.charAt(crypto.randomInt(ALPHABET.length));
  }
  return code;
}

module.exports = generateRoomCode;
module.exports.ALPHABET = ALPHABET;
module.exports.CODE_LENGTH = CODE_LENGTH;

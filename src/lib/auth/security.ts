import { createHmac, randomInt } from "node:crypto";

const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const NUMBERS = "23456789";
const SYMBOLS = "!@#$%*-_+";
const ALL_PASSWORD_CHARACTERS = `${LOWERCASE}${UPPERCASE}${NUMBERS}${SYMBOLS}`;

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function createRequestFingerprint(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function randomCharacter(characters: string) {
  return characters[randomInt(0, characters.length)];
}

export function generateIssuedPassword(length = 16) {
  const characters = [
    randomCharacter(LOWERCASE),
    randomCharacter(UPPERCASE),
    randomCharacter(NUMBERS),
    randomCharacter(SYMBOLS),
  ];

  while (characters.length < length) {
    characters.push(randomCharacter(ALL_PASSWORD_CHARACTERS));
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }

  return characters.join("");
}

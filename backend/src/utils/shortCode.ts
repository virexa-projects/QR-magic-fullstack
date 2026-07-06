import { customAlphabet } from "nanoid";

// Unambiguous alphabet (no 0/O, 1/l/I confusion) - good for scanned/typed short links
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const generate = customAlphabet(alphabet, 8);

export function generateShortCode(): string {
  return generate();
}

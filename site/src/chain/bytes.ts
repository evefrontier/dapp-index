export function hexToBytes(hex: string): Uint8Array {
  const value = hex.trim();
  if (value.length % 2 !== 0) {
    throw new Error('Hex strings must have an even number of characters.');
  }
  if (!/^[0-9a-fA-F]*$/.test(value)) {
    throw new Error('Metadata hash must be valid hex.');
  }

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

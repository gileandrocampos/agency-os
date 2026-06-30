export function generateTimestamp(): string {
  return new Date()
    .toISOString()
    .replace('T', '_')
    .replace(/[:.]/g, '-')
    .slice(0, 19);
}

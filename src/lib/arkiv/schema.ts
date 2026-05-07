export const sanitizeIdentifier = (value: string) =>
  value
    .replace(/\s+/g, '_')
    .replace(/^[^\p{L}_]+/u, '')
    .replace(/[^\p{L}\p{N}_]/gu, '')

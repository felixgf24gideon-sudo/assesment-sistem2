export function validateProfileCode(code: string): boolean {
  const regex = /^[1-6][TP][GA][IR]$/;
  return regex.test(code);
}

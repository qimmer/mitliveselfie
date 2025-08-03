export function mod(num: number, divider: number) {
  return ((num % divider) + divider) % divider;
}

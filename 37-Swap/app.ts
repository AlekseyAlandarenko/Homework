function swap(obj: Record<string, number>): Record<number, string> {
  const entries = Object.entries(obj); 
  const swapped = new Map<number, string>();

  for (const [key, value] of entries) {
    if (swapped.has(value)) {
      throw new Error(`Обнаружено дублирующее значение: ${value}`);
    }
    swapped.set(value, key);
  }

  return Object.fromEntries(swapped);
}
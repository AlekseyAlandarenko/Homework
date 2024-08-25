const obj: Record<string, number> = {
  A: 1,
  B: 2,
}
  
function swap(obj: Record<string, number>): Record<number, string> {
  return Object.fromEntries(Object.entries(obj).map(entry => entry.reverse()));
}

console.log(swap(obj));
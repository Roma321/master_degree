export {}; // Это делает файл модулем

declare global {
  interface Array<T> {
    sample(): T | undefined;
  }
}

if (!Array.prototype.sample) {
  Array.prototype.sample = function <T>(this: T[]): T | undefined {
    if (this.length === 0) {
      return undefined;
    }
    const randomIndex = Math.floor(Math.random() * this.length);
    return this[randomIndex];
  };
}
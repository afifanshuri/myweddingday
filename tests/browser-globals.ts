// Minimal browser globals for code that only listens for page events and caches in localStorage (imported before the code under test).
const listeners = { addEventListener() {}, removeEventListener() {} };
const items = new Map<string, string>();
const localStorage = { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, value); },
  removeItem: (key: string) => { items.delete(key); } };
Object.assign(globalThis, { document: { visibilityState: "visible", ...listeners }, window: listeners });
Object.defineProperty(globalThis, "localStorage", { value: localStorage, configurable: true });
export {};

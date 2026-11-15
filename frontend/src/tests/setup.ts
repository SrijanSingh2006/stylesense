// Vitest setup file with in-memory localStorage mock for Node environments
const storage: Record<string, string> = {}

const localStorageMock = {
  getItem: (key: string) => (key in storage ? storage[key] : null),
  setItem: (key: string, val: string) => {
    storage[key] = String(val)
  },
  removeItem: (key: string) => {
    delete storage[key]
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k])
  },
  length: 0,
  key: (index: number) => Object.keys(storage)[index] || null,
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

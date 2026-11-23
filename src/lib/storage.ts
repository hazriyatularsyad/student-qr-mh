type Secure = {
  getItemAsync: (k: string) => Promise<string | null>;
  setItemAsync: (k: string, v: string) => Promise<void>;
  deleteItemAsync: (k: string) => Promise<void>;
};
type Local = { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void };

// expo-secure-store has no web implementation; the browser build is a preview only.
export function createSessionStorage(platform: string, secure: Secure, local: Local | null) {
  if (platform === 'web' && local) {
    return {
      getItem: async (k: string) => local.getItem(k),
      setItem: async (k: string, v: string) => local.setItem(k, v),
      removeItem: async (k: string) => local.removeItem(k),
    };
  }
  return {
    getItem: (k: string) => secure.getItemAsync(k),
    setItem: (k: string, v: string) => secure.setItemAsync(k, v),
    removeItem: (k: string) => secure.deleteItemAsync(k),
  };
}

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const LEGACY_ACCESS_TOKEN_KEY = 'access_token';
const LEGACY_REFRESH_TOKEN_KEY = 'refresh_token';

let hasMigrated = false;

const canUseStorage = (): boolean => typeof window !== 'undefined';

const cleanupSharedLocalStorage = () => {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
};

const migrateFromLocalStorageOnce = () => {
  if (!canUseStorage() || hasMigrated) return;
  hasMigrated = true;

  const sessionAccess = sessionStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  const sessionRefresh = sessionStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);

  if (!sessionAccess) {
    const localAccess = localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
    if (localAccess) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, localAccess);
    }
  }

  if (!sessionRefresh) {
    const localRefresh = localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
    if (localRefresh) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, localRefresh);
    }
  }

  cleanupSharedLocalStorage();
};

export const getAccessToken = (): string | null => {
  if (!canUseStorage()) return null;
  migrateFromLocalStorageOnce();
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (!canUseStorage()) return null;
  migrateFromLocalStorageOnce();
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
};

export const setAuthTokens = (accessToken: string, refreshToken?: string) => {
  if (!canUseStorage()) return;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
  cleanupSharedLocalStorage();
};

export const clearAuthTokens = () => {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
  cleanupSharedLocalStorage();
};

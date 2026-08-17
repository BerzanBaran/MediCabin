const KEY = "ilac-dolabi-server-url";
export const DEFAULT_SERVER_URL = "http://localhost:8000";

export function getServerUrl(): string {
  return localStorage.getItem(KEY) || DEFAULT_SERVER_URL;
}

export function setServerUrl(url: string): void {
  localStorage.setItem(KEY, url);
}

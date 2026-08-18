const ACCOUNT_KEY = "ilac-dolabi-account";
const SESSION_KEY = "ilac-dolabi-session";

interface StoredAccount {
  tcNo: string;
  passwordHash: string;
}

/** Turkish national ID (TC Kimlik No) checksum algorithm — 11 digits, first
 * digit non-zero, with two check digits derived from the first nine. */
export function isValidTcNo(tcNo: string): boolean {
  if (!/^\d{11}$/.test(tcNo)) return false;
  const d = tcNo.split("").map(Number);
  if (d[0] === 0) return false;

  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const d10 = (oddSum * 7 - evenSum) % 10;
  const d11 = (oddSum + evenSum + d10) % 10;

  return d10 === d[9] && d11 === d[10];
}

async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getAccount(): StoredAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount) : null;
  } catch {
    return null;
  }
}

export function hasAccount(): boolean {
  return getAccount() !== null;
}

export async function register(
  tcNo: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: "invalid_tc" | "weak_password" }> {
  if (!isValidTcNo(tcNo)) return { ok: false, error: "invalid_tc" };
  if (password.length < 4) return { ok: false, error: "weak_password" };

  const passwordHash = await hashPassword(password);
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ tcNo, passwordHash } satisfies StoredAccount));
  return { ok: true };
}

export async function login(
  tcNo: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: "not_found" | "wrong_password" }> {
  const account = getAccount();
  if (!account || account.tcNo !== tcNo) return { ok: false, error: "not_found" };

  const passwordHash = await hashPassword(password);
  if (passwordHash !== account.passwordHash) return { ok: false, error: "wrong_password" };

  localStorage.setItem(SESSION_KEY, tcNo);
  return { ok: true };
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSessionTcNo(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

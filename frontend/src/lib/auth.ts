// Demo-only auth. Replace with Virexa Cloud auth before launch.
const KEY = "qrbharat_session";

export const DEMO_EMAIL = "demo@qrbharat.in";
export const DEMO_PASSWORD = "demo1234";

export interface Session {
  email: string;
  name: string;
  loggedInAt: number;
}

export function login(email: string, password: string): Session | null {
  if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
    const session: Session = {
      email: DEMO_EMAIL,
      name: "Rahul Sharma",
      loggedInAt: Date.now(),
    };
    sessionStorage.setItem(KEY, JSON.stringify(session));
    return session;
  }
  return null;
}

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function logout() {
  sessionStorage.removeItem(KEY);
}

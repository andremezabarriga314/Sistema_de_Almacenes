import { createContext, useContext, useState, ReactNode } from "react";

type User = { name: string; username: string };

type AuthState = {
  user: User | null;
  login: (username: string, password: string) => string | null;
  register: (name: string, username: string, password: string) => string | null;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "foodstock_users";
const SESSION_KEY = "foodstock_session";

type StoredUser = { name: string; username: string; password: string };

function getUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveUsers(users: StoredUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}
function getSession(): User | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getSession);

  const login = (username: string, password: string): string | null => {
    const users = getUsers();
    const found = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!found) return "Usuario no encontrado.";
    if (found.password !== password) return "Contraseña incorrecta.";
    const session = { name: found.name, username: found.username };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return null;
  };

  const register = (name: string, username: string, password: string): string | null => {
    if (!name.trim()) return "El nombre es obligatorio.";
    if (!username.trim()) return "El usuario es obligatorio.";
    if (password.length < 4) return "La contraseña debe tener al menos 4 caracteres.";
    const users = getUsers();
    if (users.find((u) => u.username.toLowerCase() === username.toLowerCase()))
      return "Ese nombre de usuario ya existe.";
    const newUser = { name: name.trim(), username: username.trim(), password };
    saveUsers([...users, newUser]);
    const session = { name: newUser.name, username: newUser.username };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return null;
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

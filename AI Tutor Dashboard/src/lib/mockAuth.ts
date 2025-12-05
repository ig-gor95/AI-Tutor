import { User } from '@/types';

// Mock аутентификация для демонстрации
const USERS_KEY = 'bigbrother_users';

function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
}

export function login(email: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }
  return null;
}

export function logout(): void {
  localStorage.removeItem('currentUser');
}

export function signup(email: string, name: string, role: 'organizer' | 'student'): User {
  const users = getUsers();
  
  // Проверка на существующего пользователя
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    throw new Error('Пользователь с таким email уже существует');
  }
  
  const newUser: User = {
    id: Date.now().toString(),
    email,
    name,
    role
  };
  
  users.push(newUser);
  saveUsers(users);
  localStorage.setItem('currentUser', JSON.stringify(newUser));
  
  return newUser;
}
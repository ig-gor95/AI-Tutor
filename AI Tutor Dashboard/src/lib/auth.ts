import api from './api';
import { User, UserRole } from '@/types';

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>('/auth/signup', {
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role.toUpperCase() // Backend expects uppercase
    });
    
    // Convert role back to lowercase for frontend
    const user = {
      ...response.data.user,
      role: response.data.user.role.toLowerCase() as UserRole
    };
    
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return {
      token: response.data.token,
      user: user
    };
  } catch (error: any) {
    console.error('Signup error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Ошибка регистрации');
  }
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>('/auth/login', data);
    
    // Convert role back to lowercase for frontend
    const user = {
      ...response.data.user,
      role: response.data.user.role.toLowerCase() as UserRole
    };
    
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return {
      token: response.data.token,
      user: user
    };
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Неверный email или пароль');
  }
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
}

export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
}


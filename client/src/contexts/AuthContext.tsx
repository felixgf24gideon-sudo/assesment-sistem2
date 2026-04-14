// client/src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { AuthState, UserProfile, LoginCredentials, RegisterData } from '../types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await loadUserProfile(session.user.id);
      } else {
        setState({ user: null, isLoading: false, error: null });
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setState({ user: null, isLoading: false, error: 'Session check failed' });
    }
  }

  async function loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setState({
        user: data as UserProfile,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      setState({ user: null, isLoading: false, error: 'Failed to load profile' });
    }
  }

  async function login(credentials: LoginCredentials) {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUserProfile(data.user.id);
      }
    } catch (error: any) {
      setState({
        user: null,
        isLoading: false,
        error: error.message || 'Login failed',
      });
      throw error;
    }
  }

async function register(data: RegisterData) {
  setState(prev => ({ ...prev, isLoading: true, error: null }));

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // 2. Parse profile code
    const level = parseInt(data.profile_code[0]) as 1 | 2 | 3 | 4 | 5 | 6;
    const visual = data.profile_code[1] as 'T' | 'P';
    const processing = data.profile_code[2] as 'G' | 'A';
    const tempo = data.profile_code[3] as 'I' | 'R';

    // 3. Create user profile (sekarang harusnya berhasil karena RLS policy sudah diupdate)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        profile_code: data.profile_code,
        pedagogic_level: level,
        visual_preference: visual,
        processing_orientation: processing,
        behavioral_tempo: tempo,
      });

    if (profileError) throw profileError;

    // 4. Load profile
    await loadUserProfile(authData.user.id);
  } catch (error: any) {
    setState({
      user: null,
      isLoading: false,
      error: error.message || 'Registration failed',
    });
    throw error;
  }
}
  async function logout() {
    try {
      await supabase.auth.signOut();
      setState({ user: null, isLoading: false, error: null });
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
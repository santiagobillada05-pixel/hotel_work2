import { supabase } from '../lib/supabaseClient';
import bcrypt from 'bcryptjs';
import api from './client';

export const authApi = {
  login: async (email, password) => {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (error || !user) {
        throw new Error('Credenciales inválidas. Por favor verifica tu correo y contraseña.');
      }

      if (!user.is_active) {
        throw new Error('Tu cuenta está inactiva. Contacta al administrador.');
      }

      const isValid = bcrypt.compareSync(password, user.hashed_password);
      if (!isValid) {
        throw new Error('Contraseña incorrecta. Por favor intenta de nuevo.');
      }

      const { hashed_password, ...safeUser } = user;
      const token = 'sb_token_' + btoa(unescape(encodeURIComponent(JSON.stringify(safeUser))));

      return {
        success: true,
        data: {
          access_token: token,
          user: safeUser,
        },
      };
    } catch (err) {
      if (err.message && (err.message.includes('Credenciales') || err.message.includes('Contraseña') || err.message.includes('inactiva'))) {
        throw err;
      }
      try {
        return await api.post('/auth/login', { email, password });
      } catch (fallbackErr) {
        throw err;
      }
    }
  },

  register: async (userData) => {
    try {
      const cleanEmail = (userData.email || '').trim().toLowerCase();
      const hashedPassword = bcrypt.hashSync(userData.password, 10);
      
      const payload = {
        email: cleanEmail,
        hashed_password: hashedPassword,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone || null,
        document_id: userData.document_id || null,
        role: userData.role || 'guest',
        is_active: true,
      };

      const { data: newUser, error } = await supabase
        .from('users')
        .insert(payload)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
        }
        throw error;
      }

      const { hashed_password, ...safeUser } = newUser;
      return { success: true, data: safeUser };
    } catch (err) {
      if (err.message && err.message.includes('Ya existe')) throw err;
      try {
        return await api.post('/auth/register', userData);
      } catch (fallbackErr) {
        throw err;
      }
    }
  },

  getProfile: async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', parsed.id)
          .single();
        if (!error && data) {
          const { hashed_password, ...safeUser } = data;
          return { success: true, data: safeUser };
        }
      }
      return api.get('/users/me');
    } catch (err) {
      return api.get('/users/me');
    }
  },

  updateProfile: async (userData) => {
    try {
      const stored = localStorage.getItem('user');
      const userId = stored ? JSON.parse(stored).id : userData.id;
      if (!userId) throw new Error('Usuario no identificado');

      const updateData = { ...userData };
      delete updateData.hashed_password;
      delete updateData.password;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      const { hashed_password, ...safeUser } = data;
      localStorage.setItem('user', JSON.stringify(safeUser));
      return { success: true, data: safeUser };
    } catch (err) {
      return api.put('/users/me', userData);
    }
  },
};

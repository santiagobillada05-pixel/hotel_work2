import { supabase } from '../lib/supabaseClient';
import bcrypt from 'bcryptjs';
import api from './client';

export const usersApi = {
  getUsers: async (params = {}) => {
    try {
      let query = supabase.from('users').select('*').order('id');
      if (params.role) query = query.eq('role', params.role);
      const { data, error } = await query;
      if (error) throw error;
      const safe = (data || []).map(({ hashed_password, ...u }) => u);
      return { success: true, data: safe };
    } catch (err) {
      return api.get('/users/', { params });
    }
  },

  getUserById: async (id) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
      if (error) throw error;
      const { hashed_password, ...safe } = data;
      return { success: true, data: safe };
    } catch (err) {
      return api.get(`/users/${id}`);
    }
  },

  updateUser: async (id, data) => {
    try {
      const payload = { ...data };
      if (payload.password) {
        payload.hashed_password = bcrypt.hashSync(payload.password, 10);
        delete payload.password;
      }
      const { data: user, error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const { hashed_password, ...safe } = user;
      return { success: true, data: safe };
    } catch (err) {
      return api.patch(`/users/${id}`, data);
    }
  },

  createStaff: async (data) => {
    try {
      const password = data.password || 'HotelWork2025!';
      const hashed_password = bcrypt.hashSync(password, 10);
      const payload = {
        email: data.email.toLowerCase().trim(),
        hashed_password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || null,
        document_id: data.document_id || null,
        role: 'staff',
        is_active: true,
      };
      const { data: user, error } = await supabase.from('users').insert(payload).select().single();
      if (error) throw error;
      const { hashed_password: _, ...safe } = user;
      return { success: true, data: safe };
    } catch (err) {
      return api.post('/users/staff', data);
    }
  },

  deleteUser: async (id) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return api.delete(`/users/${id}`);
    }
  },
};

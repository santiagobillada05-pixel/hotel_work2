import api from './client';

export const reservationsApi = {
  createReservation: (data) => api.post('/reservations/', data),
  getMyReservations: () => api.get('/reservations/my'),
  getAllReservations: (params) => api.get('/reservations/', { params }),
  getReservationById: (id) => api.get(`/reservations/${id}`),
  updateReservation: (id, data) => api.put(`/reservations/${id}`, data),
  cancelReservation: (id) => api.patch(`/reservations/${id}/cancel`),
  checkIn: (id) => api.patch(`/reservations/${id}/check-in`),
  checkOut: (id) => api.patch(`/reservations/${id}/check-out`),
  confirmReservation: (id) => api.patch(`/reservations/${id}/confirm`),
};

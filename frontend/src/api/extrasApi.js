import api from './client';

export const extrasApi = {
  getAllExtras: () => api.get('/extras/'),
  addExtraToReservation: (reservationId, data) => api.post(`/extras/reservation/${reservationId}`, data),
  removeExtraFromReservation: (reservationId, extraId) => api.delete(`/extras/reservation/${reservationId}/${extraId}`),
  getReservationExtras: (reservationId) => api.get(`/extras/reservation/${reservationId}`),
};

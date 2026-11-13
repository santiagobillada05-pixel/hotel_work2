import React, { useState, useEffect } from "react";
import { roomsApi } from "../../api/roomsApi";
import ImageGalleryEditor from "../../components/rooms/ImageGalleryEditor";
import { 
  BedDouble, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function ManageRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialFormData = {
    room_number: "",
    room_type: "single",
    price_per_night: "",
    currency: "COP",
    capacity: 1,
    description: "",
    amenities: '["WiFi", "Aire acondicionado", "Smart TV"]',
    floor: "1",
    image_urls: [""],
  };

  const [formData, setFormData] = useState(initialFormData);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roomsApi.getAllRooms({ per_page: 50, include_inactive: true });
      setRooms(res.data || []);
    } catch (err) {
      setError(err.message || "Error al obtener habitaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    // Use image_urls if available, fall back to legacy image_url
    const imgs =
      Array.isArray(room.image_urls) && room.image_urls.length > 0
        ? room.image_urls
        : room.image_url
        ? [room.image_url]
        : [""];
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      price_per_night: room.price_per_night.toString(),
      currency: room.currency || "COP",
      capacity: room.capacity,
      description: room.description || "",
      amenities: typeof room.amenities === 'string' ? room.amenities : JSON.stringify(room.amenities || []),
      floor: room.floor || "",
      image_urls: imgs,
    });
    setModalOpen(true);
  };

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await roomsApi.updateRoomStatus(roomId, newStatus);
      await fetchRooms();
    } catch (err) {
      alert(err.message || "Error al cambiar estado");
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm("Deseas desactivar esta habitacion (soft-delete)?")) return;
    try {
      await roomsApi.deleteRoom(roomId);
      await fetchRooms();
    } catch (err) {
      alert(err.message || "Error al desactivar habitacion");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate at least 1 non-empty URL
    const validUrls = formData.image_urls.filter((u) => u && u.trim());
    if (validUrls.length === 0) {
      alert("Debes agregar al menos 1 URL de imagen.");
      return;
    }
    setFormSubmitting(true);
    try {
      const payload = {
        ...formData,
        price_per_night: parseFloat(formData.price_per_night),
        capacity: parseInt(formData.capacity, 10),
        image_urls: validUrls,
      };

      if (editingRoom) {
        await roomsApi.updateRoom(editingRoom.id, payload);
      } else {
        await roomsApi.createRoom(payload);
      }

      setModalOpen(false);
      await fetchRooms();
    } catch (err) {
      alert(err.message || "Error al guardar la habitacion");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Cover image for table thumbnail
  const coverImage = (room) => {
    if (Array.isArray(room.image_urls) && room.image_urls.length > 0) return room.image_urls[0];
    if (room.image_url) return room.image_url;
    return "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=150&q=80";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2.5">
              <BedDouble className="w-7 h-7 text-brand-600" />
              Gestión de Habitaciones
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Crea, edita, cambia el estado operativo y administra el inventario de habitaciones
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={fetchRooms}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-700 dark:text-slate-200 shadow-sm transition-all"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Nueva Habitacion
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cargando inventario de habitaciones...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Numero / Foto</th>
                    <th className="py-4 px-6">Tipo</th>
                    <th className="py-4 px-6">Capacidad</th>
                    <th className="py-4 px-6">Tarifa / Noche</th>
                    <th className="py-4 px-6">Estado Operativo</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-slate-50 dark:bg-slate-900/50/70 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img
                          src={coverImage(room)}
                          alt={room.room_number}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=150&q=80";
                          }}
                        />
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-slate-50 block">
                            Habitacion {room.room_number}
                          </span>
                          <span className="text-xs text-slate-400">Piso {room.floor || 1}</span>
                          {Array.isArray(room.image_urls) && room.image_urls.length > 1 && (
                            <span className="text-[10px] text-brand-600 font-semibold block">
                              {room.image_urls.length} fotos
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-100 capitalize">
                        {room.room_type}
                      </td>

                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                        {room.capacity} persona(s)
                      </td>

                      <td className="py-4 px-6 font-extrabold text-slate-900 dark:text-slate-50">
                        ${Number(room.price_per_night > 0 && room.price_per_night < 2000 ? room.price_per_night * 4000 : room.price_per_night).toLocaleString("es-CO")} COP
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={room.status}
                          onChange={(e) => handleStatusChange(room.id, e.target.value)}
                          className={"text-xs font-bold rounded-xl px-2.5 py-1.5 border focus:outline-none focus:ring-2 focus:ring-brand-500 " + (
                            room.status === "available"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          )}
                        >
                          <option value="available">Disponible</option>
                          <option value="occupied">Ocupada</option>
                        </select>
                        {room.status === "occupied" && (
                          <span className="block mt-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
                            Ocupada actualmente
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(room)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(room.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Desactivar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/50 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  {editingRoom ? "Editar Habitacion " + editingRoom.room_number : "Nueva Habitacion"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                      Número (Solo Números)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value.replace(/\D/g, '') })}
                      placeholder="101"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.room_type}
                      onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="single">Individual</option>
                      <option value="double">Doble</option>
                      <option value="suite">Suite</option>
                      <option value="deluxe">Deluxe</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                      Tarifa (Solo Números)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        value={formData.price_per_night}
                        onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value.replace(/\D/g, '') })}
                        placeholder="150000"
                        className="w-2/3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                      <div className="w-1/3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl px-2 py-2 text-xs font-bold text-center flex items-center justify-center">
                        COP ($)
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                      Capacidad (Solo Números)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value.replace(/\D/g, '') })}
                      placeholder="2"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                      Piso (Solo Números)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value.replace(/\D/g, '') })}
                      placeholder="1"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Gallery Editor - replaces single image_url input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Fotos de la Habitacion
                  </label>
                  <ImageGalleryEditor
                    images={formData.image_urls}
                    onChange={(urls) => setFormData({ ...formData, image_urls: urls })}
                    maxImages={10}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Descripcion
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Habitacion con cama king, minibar y balcon..."
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Amenidades (JSON array)
                  </label>
                  <input
                    type="text"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow disabled:opacity-50"
                  >
                    {formSubmitting ? "Guardando..." : "Guardar Habitacion"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-xl text-sm transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
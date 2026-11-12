import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Hotel, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  CreditCard, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  X, 
  ExternalLink, 
  CheckCircle2,
  DollarSign,
  Scale,
  Eye,
  EyeOff
} from 'lucide-react';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    document_id: '',
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsError, setTermsError] = useState(null);

  const { register, login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) clearError();
  };

  const handleTermsCheckboxChange = (e) => {
    setAcceptedTerms(e.target.checked);
    if (e.target.checked) {
      setTermsError(null);
    }
  };

  const handleAcceptTermsInModal = () => {
    setAcceptedTerms(true);
    setTermsError(null);
    setShowTermsModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setTermsError('Debes aceptar los Términos y Condiciones para poder registrar tu cuenta.');
      return;
    }

    try {
      await register({
        ...formData,
        accepted_terms: true
      });
      // Auto login after register
      await login(formData.email, formData.password);
      navigate('/');
    } catch {
      // Handled by auth store
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/30">
            <Hotel className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            Crear Cuenta de Huésped
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Regístrate para reservar habitaciones y gestionar tus estadías en Colombia
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Nombre
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Carlos"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Apellido
              </label>
              <input
                type="text"
                required
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="García"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="carlos@ejemplo.com"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Contraseña (mínimo 8 caracteres)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+57 300 1234567"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Documento de Identidad
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="document_id"
                  value={formData.document_id}
                  onChange={handleChange}
                  placeholder="CC o Pasaporte"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Terms and Conditions Confirmation Checkbox */}
          <div className={`p-4 rounded-2xl border transition-all ${
            termsError 
              ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-400' 
              : acceptedTerms
              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40'
          }`}>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={handleTermsCheckboxChange}
                className="w-4 h-4 mt-1 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
              />
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <span>He leído y acepto los </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 underline inline-flex items-center gap-0.5 focus:outline-none"
                >
                  Términos y Condiciones
                </button>
                <span> y la </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 underline focus:outline-none"
                >
                  Política de Tratamiento de Datos Personales
                </button>
                <span> de HotelWork para la República de Colombia.</span>
              </div>
            </label>

            {termsError && (
              <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold mt-2.5 pl-7 flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{termsError}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className={`w-full font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm mt-3 ${
              !acceptedTerms
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-brand-500/25 hover:shadow-lg'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando cuenta...
              </>
            ) : !acceptedTerms ? (
              <>
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                Acepta los términos para continuar
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Crear Cuenta de Huésped
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ¿Ya tienes una cuenta registrada?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      {/* Interactive Terms & Conditions Modal (TikTok / Airbnb style) */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col max-h-[88vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 dark:bg-brand-950 text-brand-600 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    Términos y Condiciones
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    HotelWork Colombia • Marco Legal Vigente (Ley 1480 de 2011 & Ley 1581 de 2012)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 bg-brand-50/50 dark:bg-brand-950/30 rounded-xl border border-brand-100 dark:border-brand-900/40 text-brand-800 dark:text-brand-300">
                <span className="font-bold block mb-1">Resumen para Registro Rápido:</span>
                Al crear una cuenta en HotelWork, confirmas que eres mayor de edad, que la información proporcionada es fidedigna y que aceptas las políticas de reservación, tarifas en Pesos Colombianos (COP) y tratamiento de datos personales.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
                  1. Moneda Predeterminada y Tarifas en Pesos Colombianos (COP)
                </h4>
                <p>
                  Todas las tarifas de habitaciones, suplementos, depósitos y cobros de confirmación se liquidan oficialmente en <strong>Pesos Colombianos (COP)</strong>. Las tarifas a residentes en Colombia incluyen el Impuesto al Valor Agregado (IVA del 19%) según la normativa DIAN.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
                  2. Identificación Obligatoria para Registro de Entrada
                </h4>
                <p>
                  Conforme a la regulación migratoria y hotelera colombiana, cada huésped debe presentar un documento de identidad original físico y válido (Cédula de Ciudadanía, Cédula de Extranjería o Pasaporte) al momento del registro de entrada presencial en el establecimiento.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
                  3. Política de Cancelación y No-Show
                </h4>
                <p>
                  Las reservas pueden cancelarse sin costo adicional con al menos <strong>24 horas de antelación</strong> a la fecha de llegada. Cancelaciones posteriores o la no presentación (no-show) darán lugar a un cobro correspondiente a la tarifa de la primera noche de hospedaje.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
                  4. Tratamiento de Datos Personales (Habeas Data - Ley 1581 de 2012)
                </h4>
                <p>
                  Autorizas a HotelWork a almacenar y procesar tus datos para procesar reservaciones, emitir facturación electrónica, enviar notificaciones de confirmación y reportar el registro hotelero exigido por las autoridades nacionales. Puedes solicitar rectificación o supresión en cualquier momento.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
                  5. Protección a Menores de Edad (Ley 679 de 2001)
                </h4>
                <p>
                  HotelWork rechaza de manera categórica la explotación y el abuso sexual de menores de edad en el turismo. Todo menor de edad debe estar acompañado por sus padres o contar con autorización notariada según la legislación colombiana.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <Link
                  to="/terminos"
                  target="_blank"
                  className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-bold inline-flex items-center gap-1.5 underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Leer documento completo de Términos y Condiciones en nueva pestaña
                </Link>
              </div>
            </div>

            {/* Modal Footer with Confirmation Button */}
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
                Al hacer clic confirmas haber leído las políticas
              </span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleAcceptTermsInModal}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aceptar Términos y Continuar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

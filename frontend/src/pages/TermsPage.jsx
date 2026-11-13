import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Printer, 
  ArrowLeft, 
  FileText, 
  DollarSign, 
  CreditCard, 
  CalendarCheck, 
  Lock, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Scale,
  Sparkles
} from 'lucide-react';

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('tarificacion');

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    { id: 'identificacion', title: '1. Identificación y Marco Legal', icon: Scale },
    { id: 'tarificacion', title: '2. Tarifas en Pesos Colombianos (COP) e IVA', icon: DollarSign },
    { id: 'reservas', title: '3. Proceso de Reserva y Medios de Pago', icon: CreditCard },
    { id: 'checkin', title: '4. Registro de Entrada, Check-out y Registro Hotelero', icon: CalendarCheck },
    { id: 'cancelaciones', title: '5. Cancelaciones, Retracto y No-Show', icon: FileText },
    { id: 'habeasdata', title: '6. Protección de Datos (Ley 1581 de 2012)', icon: Lock },
    { id: 'convivencia', title: '7. Convivencia y Espacio Libre de Humo', icon: CheckCircle },
    { id: 'menores', title: '8. Protección de Menores (Ley 679 de 2001)', icon: AlertTriangle },
    { id: 'responsabilidad', title: '9. Custodia de Pertenencias y Responsabilidad', icon: ShieldCheck },
    { id: 'pqr', title: '10. Peticiones, Reclamos y Jurisdicción', icon: HelpCircle },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900/50 py-8 print:py-0 print:bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Breadcrumb & Print Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a inicio
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Vigente en Colombia (2026)
            </span>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Main Header Banner */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="p-4 bg-brand-50 dark:bg-brand-950/40 text-brand-600 rounded-2xl shrink-0 shadow-inner">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-md">
                  Contrato de Hospedaje y Políticas de Uso
                </span>
                <span className="text-xs text-slate-400">• Actualizado para Colombia</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                Términos y Condiciones Generales
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Bienvenido a <span className="font-bold text-slate-800 dark:text-slate-200">HotelWork</span>. Este documento regula el acceso a nuestra plataforma, las condiciones de reserva y contratación de servicios de alojamiento, la política tarifaria en Pesos Colombianos (COP) y la protección de datos personales de acuerdo con la legislación de la República de Colombia.
              </p>
            </div>
          </div>

          {/* Quick Highlight Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Moneda Oficial</span>
              <p className="text-slate-500 dark:text-slate-400">Precios predeterminados en Pesos Colombianos (COP).</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">IVA 19% Incluido</span>
              <p className="text-slate-500 dark:text-slate-400">Desglose transparente del impuesto nacional.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Habeas Data</span>
              <p className="text-slate-500 dark:text-slate-400">Protección estricta de datos (Ley 1581 de 2012).</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Protección Menores</span>
              <p className="text-slate-500 dark:text-slate-400">Prevención ESCNNA bajo Ley 679 de 2001.</p>
            </div>
          </div>
        </div>

        {/* Content Layout with Side Index */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sticky Navigation Index */}
          <div className="hidden lg:block lg:col-span-4 print:hidden">
            <div className="sticky top-24 bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-3">
                Contenido del Contrato
              </h3>
              <nav className="space-y-1">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={() => setActiveSection(sec.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                      <span className="truncate">{sec.title}</span>
                    </a>
                  );
                })}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 px-2 space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300">¿Dudas sobre estos términos?</p>
                <p>Escríbenos a <span className="font-semibold text-brand-600">legal@hotelwork.com</span></p>
              </div>
            </div>
          </div>

          {/* Right Detailed Sections Content */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. Identificación */}
            <section id="identificacion" className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
                  <Scale className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  1. Identificación del Operador y Marco Legal
                </h2>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  El presente servicio de intermediación y gestión hotelera es operado por <strong className="text-slate-800 dark:text-slate-100">HotelWork Colombia</strong>, establecimiento formalmente constituido bajo las leyes de la República de Colombia, con Registro Nacional de Turismo (RNT) debidamente activo y al día conforme a la Ley 300 de 1996, Ley 1101 de 2006 y Ley 2068 de 2020 (Ley General de Turismo).
                </p>
                <p>
                  La creación de una cuenta de usuario, la navegación en el portal o la confirmación de una reserva constituyen la aceptación íntegra, libre y voluntaria de estas cláusulas contractuales por parte del cliente o huésped.
                </p>
              </div>
            </section>

            {/* 2. Tarificación en COP */}
            <section id="tarificacion" className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-200 dark:border-brand-800/80 scroll-mt-24 ring-1 ring-brand-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    2. Tarifas Oficiales en Pesos Colombianos (COP) e Impuestos
                  </h2>
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Precios claros y sin cobros ocultos</span>
                </div>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  En cumplimiento del <strong>Estatuto del Consumidor (Ley 1480 de 2011)</strong> y las circulares de la Superintendencia de Industria y Comercio (SIC):
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-200">
                  <li>
                    <strong>Moneda predeterminada:</strong> Todos los precios de habitaciones, tarifas por noche, servicios adicionales y cobros de confirmación se expresan y cobran por defecto en <strong>Pesos Colombianos (COP)</strong>.
                  </li>
                  <li>
                    <strong>Impuesto al Valor Agregado (IVA):</strong> De acuerdo con la normativa tributaria colombiana de la DIAN, las tarifas de alojamiento para residentes en Colombia causan un <strong>IVA del 19%</strong>, el cual se encuentra detallado en el desglose de su reserva y factura electrónica.
                  </li>
                  <li>
                    <strong>Moneda de operación:</strong> Todas las tarifas, liquidación de cargos, facturación electrónica y pagos en línea o recepción se efectúan exclusivamente en <strong>Pesos Colombianos (COP)</strong>, la moneda de curso legal en la República de Colombia.
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. Reservas y Pagos */}
            <section id="reservas" className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  3. Proceso de Reserva y Medios de Pago Autorizados
                </h2>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Para garantizar la habitación, el huésped debe completar el formulario con información veraz (nombre completo, documento de identidad, correo electrónico y teléfono de contacto).
                </p>
                <p>
                  Se aceptan los siguientes medios de pago autorizados en Colombia:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs font-semibold">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    Tarjeta de Crédito
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    Tarjeta Débito / PSE
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    Efectivo en Recepción
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    Transferencia Bancaria
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  El pago total de la estadía debe estar completamente asentado y confirmado antes de la entrega formal de la llave o durante el proceso de check-out según la política pactada.
                </p>
              </div>
            </section>

            {/* 4. Check-in / Check-out */}
            <section id="checkin" className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  4. Registro de Entrada, Check-out y Registro Hotelero
                </h2>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Horario de Entrada:</strong> A partir de las <strong>3:00 PM</strong>.
                  </li>
                  <li>
                    <strong>Horario de Check-out:</strong> Hasta las <strong>11:00 AM</strong>. Salidas posteriores sin autorización previa estarán sujetas a cobro de media tarifa o tarifa completa de una noche.
                  </li>
                  <li>
                    <strong>Identificación obligatoria:</strong> Conforme al Decreto 2590 de 2009 de Colombia, cada persona mayor de edad que ingrese a la habitación debe presentar documento de identidad original físico vigente (Cédula de Ciudadanía, Cédula de Extranjería o Pasaporte).
                  </li>
                </ul>
              </div>
            </section>

            {/* 5. Cancelaciones y Reembolsos */}
            <section id="cancelaciones" className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  5. Cancelaciones, Derecho de Retracto y No-Show
                </h2>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  <strong>Cancelación Estándar:</strong> El huésped puede cancelar su reserva sin penalidad si notifica formalmente a través del sistema con al menos <strong>24 horas de anticipación</strong> a la fecha fijada de entrada.
                </p>
                <p>
                  <strong>No-Show (No Presentación):</strong> En caso de que el huésped no se presente el día previsto sin notificación previa oportuna, se cobrará una penalidad equivalente al valor de la primera noche de hospedaje en concepto de indemnización por retención de inventario.
                </p>
                <p>
                  <strong>Derecho de Retracto:</strong> Conforme al artículo 47 de la Ley 1480 de 2011, en compras realizadas mediante medios no presenciales o electrónicos, el consumidor podrá ejercer el derecho de retracto dentro de los cinco (5) días hábiles siguientes a la compra, siempre que la prestación del servicio de alojamiento no inicie dentro de dicho lapso.
                </p>
              </div>
            </section>

            {/* 6. Habeas Data */}
            <section id="habeasdata" className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  6. Tratamiento y Protección de Datos Personales (Ley 1581 de 2012)
                </h2>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Al registrar una cuenta en HotelWork, el titular de los datos autoriza de manera previa, expresa e informada el tratamiento de su información personal conforme al régimen de <strong>Habeas Data (Ley 1581 de 2012 y Decreto 1377 de 2013)</strong>.
                </p>
                <p>
                  <strong>Finalidades del tratamiento:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <li>Gestión operativa de reservas, registro de entrada, check-out y facturación electrónica DIAN.</li>
                  <li>Envío de confirmaciones, comprobantes de pago y notificaciones sobre el estado de la estadía.</li>
                  <li>Cumplimiento de obligaciones ante Migración Colombia y la Policía Nacional (Tarjeta de Registro de Alojamiento - TRA).</li>
                </ul>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  El titular puede ejercer en cualquier momento sus derechos de conocer, actualizar, rectificar o solicitar la supresión de sus datos mediante solicitud a <span className="font-semibold text-brand-600">privacidad@hotelwork.com</span>.
                </p>
              </div>
            </section>

            {/* 7. Convivencia y No Fumar */}
            <section id="convivencia" className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  7. Convivencia Pacífica y Espacio 100% Libre de Humo (Ley 1335 de 2009)
                </h2>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  En cumplimiento de la <strong>Ley 1335 de 2009 (Ley Antitabaco de Colombia)</strong>, está estrictamente prohibido fumar o usar cigarrillos electrónicos / vapeadores en todas las habitaciones y áreas cerradas del hotel.
                </p>
                <p>
                  Fumar en la habitación acarreará un cargo de limpieza profunda y desionización de <strong>$200.000 COP</strong> añadido directamente a la cuenta del huésped. Asimismo, los huéspedes se comprometen a respetar las normas de tranquilidad, absteniéndose de ruidos molestos entre las 10:00 PM y las 7:00 AM.
                </p>
              </div>
            </section>

            {/* 8. Prevención de Explotación de Menores (Ley 679 de 2001) */}
            <section id="menores" className="bg-rose-50/60 dark:bg-rose-950/20 rounded-3xl p-6 sm:p-8 shadow-sm border border-rose-200 dark:border-rose-900/50 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-rose-950 dark:text-rose-100">
                    8. Protección de Niñas, Niños y Adolescentes (Ley 679 de 2001)
                  </h2>
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Advertencia legal obligatoria del sector turístico</span>
                </div>
              </div>
              <div className="text-sm text-rose-900 dark:text-rose-200/90 space-y-3 leading-relaxed">
                <p className="font-semibold">
                  HotelWork advierte, previene y rechaza de forma tajante la explotación y el abuso sexual de menores de edad en el turismo.
                </p>
                <p className="text-xs">
                  En cumplimiento de la <strong>Ley 679 de 2001</strong>, la <strong>Ley 1336 de 2009</strong> y la <strong>Resolución 3840 de 2009</strong>, advertimos que la explotación y el abuso sexual de menores de edad son sancionados en Colombia con penas privativas de la libertad y multas de conformidad con las leyes vigentes.
                </p>
                <p className="text-xs">
                  Para el ingreso de menores de edad, es requisito ineludible presentar el Registro Civil de Nacimiento o Tarjeta de Identidad, y en caso de no estar acompañados por sus padres, la autorización escrita debidamente autenticada ante Notaría en Colombia.
                </p>
              </div>
            </section>

            {/* 9. Responsabilidad */}
            <section id="responsabilidad" className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  9. Custodia de Objetos de Valor y Responsabilidad
                </h2>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  El hotel dispone de cajas de seguridad en las habitaciones para la custodia de dinero en efectivo, joyas, dispositivos electrónicos y documentos valiosos.
                </p>
                <p>
                  De conformidad con el Código de Comercio de Colombia, el establecimiento no se hace responsable por pérdidas o extravíos de objetos o dinero que no hayan sido formalmente declarados y depositados en custodia directa de la administración hotelera.
                </p>
              </div>
            </section>

            {/* 10. PQR y Jurisdicción */}
            <section id="pqr" className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  10. Peticiones, Quejas, Reclamos (PQR) y Jurisdicción Aplicable
                </h2>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Cualquier petición, felicitación, queja o reclamo podrá ser presentada a través de la plataforma o al correo electrónico <span className="font-semibold text-brand-600">soporte@hotelwork.com</span>. Las solicitudes serán atendidas dentro de los quince (15) días hábiles siguientes conforme a la normatividad colombiana.
                </p>
                <p>
                  Cualquier diferencia o litigio derivado del presente contrato se resolverá conforme a las leyes de la República de Colombia, ante las autoridades competentes y la <strong>Superintendencia de Industria y Comercio (SIC)</strong> en su calidad de entidad de inspección, vigilancia y control.
                </p>
              </div>
            </section>

            {/* Bottom Final Note */}
            <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
              <p>© {new Date().getFullYear()} HotelWork Colombia S.A.S. • Todos los derechos reservados.</p>
              <p className="mt-1">Registro Nacional de Turismo (RNT) Colombia • Sistema PMS Hotelero</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

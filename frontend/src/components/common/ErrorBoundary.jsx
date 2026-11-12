import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-slate-200 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
              !
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Ocurrió un error inesperado</h2>
            <p className="text-sm text-slate-600 mb-6">
              {this.state.error?.message || 'Hubo un inconveniente al cargar la aplicación. Intenta recargar la página.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

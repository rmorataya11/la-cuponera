import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="relative text-center max-w-xl mx-auto pt-4 sm:pt-8">
      <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-10 shadow-lg shadow-slate-200/50 sm:py-12">
        <h1
          className="text-3xl sm:text-4xl font-semibold text-[#0f4d57] tracking-tight mb-3 animate-fade-in-up"
          style={{ animationDelay: '0.15s' }}
        >
          Las mejores ofertas en un solo lugar
        </h1>
        <p
          className="text-slate-600 mb-10 leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          {user
            ? 'Elige tu oferta y disfruta de los descuentos.'
            : 'Descubre cupones de descuento de tus marcas favoritas. Regístrate, elige tu oferta y disfruta.'}
        </p>
        <div
          className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up"
          style={{ animationDelay: '0.45s' }}
        >
          <Link
            to="/ofertas"
            className="btn-primary px-6 py-3 text-base transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
          >
            Ver ofertas
          </Link>
          {!user && (
            <Link
              to="/registro"
              className="btn-secondary px-6 py-3 text-base transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-slate-300 active:scale-[0.98]"
            >
              Crear cuenta
            </Link>
          )}
        </div>
        {!user && (
          <p
            className="mt-10 text-sm text-slate-500 animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            ¿Ya tienes cuenta?{' '}
            <Link to="/iniciar-sesion" className="font-medium text-[#2097A9] hover:text-primary-700 transition-colors">
              Inicia sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

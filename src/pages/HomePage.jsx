import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
        Las mejores ofertas en un solo lugar
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Descubre cupones de descuento de tus marcas favoritas. Regístrate, elige tu oferta y disfruta.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/ofertas"
          className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition"
        >
          Ver ofertas
        </Link>
        <Link
          to="/registro"
          className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition"
        >
          Crear cuenta
        </Link>
      </div>
      <p className="mt-8 text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/iniciar-sesion" className="font-medium text-orange-600 hover:text-orange-700">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="text-center max-w-xl mx-auto pt-4 sm:pt-8">
      <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-3">
        Las mejores ofertas en un solo lugar
      </h1>
      <p className="text-slate-600 mb-10 leading-relaxed">
        Descubre cupones de descuento de tus marcas favoritas. Regístrate, elige tu oferta y disfruta.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/ofertas"
          className="btn-primary px-6 py-3 text-base"
        >
          Ver ofertas
        </Link>
        <Link
          to="/registro"
          className="btn-secondary px-6 py-3 text-base"
        >
          Crear cuenta
        </Link>
      </div>
      <p className="mt-10 text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/iniciar-sesion" className="font-medium text-blue-800 hover:text-blue-900">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

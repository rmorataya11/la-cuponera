import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-orange-600 hover:text-orange-700">
            La Cuponera
          </Link>
          <nav className="flex gap-6">
            <Link to="/" className="text-gray-600 hover:text-orange-600 font-medium">
              Inicio
            </Link>
            <Link to="/ofertas" className="text-gray-600 hover:text-orange-600 font-medium">
              Ofertas
            </Link>
            <Link to="/registro" className="text-gray-600 hover:text-orange-600 font-medium">
              Registro
            </Link>
            <Link to="/iniciar-sesion" className="text-gray-600 hover:text-orange-600 font-medium">
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

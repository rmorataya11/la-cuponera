import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import OfertasPage from './pages/OfertasPage';
import OfertaDetailPage from './pages/OfertaDetailPage';
import ComprarPage from './pages/ComprarPage';
import RegistroPage from './pages/RegistroPage';
import ActivarEmpresaPage from './pages/ActivarEmpresaPage';
import LoginPage from './pages/LoginPage';
import RestablecerContrasenaPage from './pages/RestablecerContrasenaPage';
import MisCuponesPage from './pages/MisCuponesPage';
import CuponiaAdminDashboard from './pages/AdminDashboard';
import PanelEmpresaPage from './pages/PanelEmpresaPage';
import CanjearPage from './pages/CanjearPage';
import AdminRoute from './components/AdminRoute';
import EmpresaRoute from './components/EmpresaRoute';
import EmpleadoRoute from './components/EmpleadoRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="ofertas" element={<OfertasPage />} />
          <Route path="ofertas/:id" element={<OfertaDetailPage />} />
          <Route
            path="ofertas/:id/comprar"
            element={
              <ProtectedRoute>
                <ComprarPage />
              </ProtectedRoute>
            }
          />
          <Route path="registro" element={<RegistroPage />} />
          <Route path="activar-empresa" element={<ActivarEmpresaPage />} />
          <Route path="iniciar-sesion" element={<LoginPage />} />
          <Route path="restablecer-contrasena" element={<RestablecerContrasenaPage />} />
          <Route
            path="mis-cupones"
            element={
              <ProtectedRoute>
                <MisCuponesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <CuponiaAdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="panel-empresa"
            element={
              <EmpresaRoute>
                <PanelEmpresaPage />
              </EmpresaRoute>
            }
          />
          <Route
            path="canjear"
            element={
              <EmpleadoRoute>
                <CanjearPage />
              </EmpleadoRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

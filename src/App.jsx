import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import OfertasPage from './pages/OfertasPage';
import OfertaDetailPage from './pages/OfertaDetailPage';
import ComprarPage from './pages/ComprarPage';
import RegistroPage from './pages/RegistroPage';
import LoginPage from './pages/LoginPage';
import MisCuponesPage from './pages/MisCuponesPage';

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
          <Route path="iniciar-sesion" element={<LoginPage />} />
          <Route
            path="mis-cupones"
            element={
              <ProtectedRoute>
                <MisCuponesPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

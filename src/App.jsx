import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import OfertasPage from './pages/OfertasPage';
import RegistroPage from './pages/RegistroPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="ofertas" element={<OfertasPage />} />
          <Route path="registro" element={<RegistroPage />} />
          <Route path="iniciar-sesion" element={<LoginPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

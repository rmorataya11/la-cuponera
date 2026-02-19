import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function ComprarPage() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Comprar cupón</h1>
      <p className="text-gray-600">
        Oferta ID: {id}. Flujo de compra (cantidad, pago simulado, generación de cupón) — próximo paso.
      </p>
      <Link to={`/ofertas/${id}`} className="mt-4 inline-block text-orange-600 hover:text-orange-700">
        ← Volver al detalle
      </Link>
    </div>
  );
}

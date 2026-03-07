import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function KdsLayout() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pos')}
            className="text-gray-400 hover:text-white p-1"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Cocina (KDS)</h1>
        </div>
        <div className="text-sm text-gray-400">
          {new Date().toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}

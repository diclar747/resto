import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MenuPage } from './views/MenuPage';
import { OrderStatusPage } from './views/OrderStatusPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/mesa/:tableCode" element={<MenuPage />} />
        <Route path="/mesa/:tableCode/status" element={<OrderStatusPage />} />
        <Route path="*" element={
          <div className="flex items-center justify-center h-screen text-gray-500">
            <p>Escanea un código QR para ver el menú</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

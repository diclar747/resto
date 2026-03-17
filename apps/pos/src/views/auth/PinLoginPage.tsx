import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Delete, ArrowLeft, Key, X } from 'lucide-react';
import { getRoleDefaultPath } from '../../utils/role-routing';

export function PinLoginPage() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        handleLogin(newPin);
      }
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  const handleLogin = async (pinCode: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/pin-login', { pin: pinCode });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('¡Acceso concedido!');
      navigate(getRoleDefaultPath(data.user.role));
    } catch {
      toast.error('PIN inválido');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]" />

      <div className="bg-white/70 dark:bg-surface/70 backdrop-blur-xl border border-white/40 rounded-3xl sm:rounded-[48px] shadow-2xl w-full max-w-sm p-6 sm:p-10 relative z-10">
        <div className="flex items-center gap-4 mb-6 sm:mb-10">
          <button
            onClick={() => navigate('/login')}
            className="w-10 h-10 bg-gray-50 dark:bg-white/5 flex items-center justify-center rounded-xl text-gray-400 dark:text-white/40 hover:text-primary hover:bg-white dark:hover:bg-surface transition-all shadow-sm border border-transparent hover:border-primary/20"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-black text-secondary tracking-tight">Acceso Rápido</h2>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-0.5">Ingresa tu código PIN</p>
          </div>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 sm:gap-6 mb-8 sm:mb-12">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length
                  ? 'bg-primary scale-125 shadow-lg shadow-primary/40'
                  : 'bg-gray-200 dark:bg-white/15'
                }`}
            />
          ))}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, i) => {
            if (key === '') return <div key="empty" className="h-16" />;
            if (key === 'del') {
              return (
                <button
                  key="del"
                  onClick={handleDelete}
                  className="h-16 sm:h-20 rounded-[28px] bg-white dark:bg-surface border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm group active:scale-95"
                >
                  <Delete size={24} className="group-hover:scale-110 transition-transform" />
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => handleDigit(key)}
                disabled={loading}
                className="h-16 sm:h-20 rounded-[28px] bg-white dark:bg-surface border border-gray-100 dark:border-white/10 flex items-center justify-center text-2xl font-black text-secondary hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {key}
              </button>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Seguridad por Hardware Encriptada</p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Utensils, Mail, Lock, LogIn, Key, ArrowRight } from 'lucide-react';
import { getRoleDefaultPath } from '../../utils/role-routing';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('¡Bienvenido!', {
        icon: '👋',
        style: { borderRadius: '16px', background: '#001F3D', color: '#fff' }
      });
      navigate(getRoleDefaultPath(data.user.role));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]" />

      <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[40px] shadow-2xl w-full max-w-md p-10 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6 rotate-3">
            <Utensils className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">
            Resto<span className="text-primary">POS</span>
          </h1>
          <p className="text-text-secondary font-semibold text-sm mt-1 uppercase tracking-widest">Panel de Control</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-secondary uppercase tracking-widest ml-1">Email Corporativo</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
                placeholder="usuario@restaurante.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black text-secondary uppercase tracking-widest">Contraseña</label>
              <button type="button" className="text-[10px] font-bold text-primary hover:underline">¿Olvido su clave?</button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                <span>Entrar al Sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col gap-4">
          <button
            onClick={() => navigate('/pin')}
            className="flex items-center justify-center gap-2 text-text-secondary hover:text-secondary font-bold text-xs transition-colors"
          >
            <Key size={14} /> Acceso rápido con PIN
          </button>
          <a
            href="/"
            className="flex items-center justify-center gap-2 text-primary/60 hover:text-primary font-bold text-xs transition-colors"
          >
            Volver a la Web <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { ArrowLeft, Bell, LogOut, User, ChefHat, Maximize2, Minimize2 } from 'lucide-react';
import { useFullscreen } from '../hooks/useFullscreen';
import { useState } from 'react';

export function KdsLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="bg-gray-800 px-6 py-3 flex items-center justify-between border-b border-gray-700/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pos')}
            className="text-gray-400 dark:text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-gray-700 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 rotate-2">
              <ChefHat className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight leading-none">Cocina <span className="text-amber-400 italic">KDS</span></h1>
              <p className="text-[9px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest">Kitchen Display System</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-white/40">
          <span className="hidden md:block font-medium">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleFullscreen} title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-all">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          {/* Notification Bell - controlled by KdsPage via custom event */}
          <div id="kds-notification-bell" />

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-700/50 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-amber-500/20">
                {user?.firstName?.[0]?.toUpperCase() || 'C'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-gray-200 leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] text-gray-500 dark:text-white/40 font-medium">Cocina</p>
              </div>
            </button>

            {showProfile && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {/* Profile Header */}
                  <div className="p-5 border-b border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-black shadow-lg">
                        {user?.firstName?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{user?.firstName} {user?.lastName}</p>
                        <p className="text-[10px] text-gray-400 dark:text-white/40 font-medium">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400">
                          Cocina
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2">
                    <button
                      onClick={() => { logout(); navigate('/login'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <LogOut size={16} /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import {
    LayoutDashboard, Store, Users, BarChart3,
    ArrowLeft, LogOut, Settings, Bell, Search, User, FileText, Menu, X,
    Maximize2, Minimize2
} from 'lucide-react';
import { useFullscreen } from '../hooks/useFullscreen';

const navItems = [
    { to: '/superadmin', icon: LayoutDashboard, label: 'Panel Global', end: true },
    { to: '/superadmin/restaurants', icon: Store, label: 'Restaurantes' },
    { to: '/superadmin/users', icon: Users, label: 'Administradores' },
    { to: '/superadmin/reports', icon: BarChart3, label: 'Métricas' },
    { to: '/superadmin/audit', icon: FileText, label: 'Auditoría' },
];

export function SuperAdminLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { isFullscreen, toggleFullscreen } = useFullscreen();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen flex bg-background overflow-hidden">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-surface border-r border-gray-100 dark:border-white/10 flex flex-col shadow-[20px_0_40px_rgba(0,0,0,0.02)]
                transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 rotate-3">
                                <span className="text-white font-black text-xl italic">S</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-secondary tracking-tight leading-none">Super<span className="text-indigo-600 italic">Resto</span></h1>
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-0.5">Control Global</p>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-white/40">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-50 dark:border-white/5 mx-6 mb-6 opacity-50" />

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map(({ to, icon: Icon, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-black tracking-wide transition-all duration-300 group ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 scale-[1.02]'
                                    : 'text-text-secondary hover:text-secondary hover:bg-gray-50 dark:hover:bg-white/5'
                                }`
                            }
                        >
                            <Icon size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="uppercase tracking-[0.05em]">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 md:p-6">
                    <div className="bg-gray-50 dark:bg-white/5 rounded-[32px] p-4 md:p-5 space-y-3">
                        <button
                            onClick={() => { navigate('/pos'); setSidebarOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-secondary hover:bg-white dark:hover:bg-surface hover:shadow-sm transition-all uppercase tracking-widest"
                        >
                            <ArrowLeft size={16} /> Volver al POS
                        </button>
                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-rose-500 hover:bg-rose-50 transition-all uppercase tracking-widest"
                        >
                            <LogOut size={16} /> Cerrar Sesión
                        </button>
                    </div>
                    <div className="mt-4 md:mt-6 flex items-center gap-3 px-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 border-2 border-white dark:border-white/10 shadow-sm flex items-center justify-center overflow-hidden">
                            <User className="text-indigo-600" size={20} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black text-secondary truncate uppercase">{user?.firstName || 'Super'} {user?.lastName}</p>
                            <p className="text-[10px] font-bold text-text-secondary truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 md:h-20 bg-white/70 dark:bg-surface/70 backdrop-blur-md border-b border-gray-100 dark:border-white/10 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Hamburger button */}
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/40">
                            <Menu size={22} />
                        </button>

                        <div className="relative group max-w-sm w-64 hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-white/40 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar restaurantes o usuarios..."
                                className="w-full pl-12 pr-4 py-2 bg-gray-50 dark:bg-white/5 border-transparent rounded-xl focus:bg-white dark:focus:bg-surface focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all text-xs font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 ml-auto">
                        <button onClick={toggleFullscreen} title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-indigo-600 transition-all">
                            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-indigo-600 transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white dark:border-surface rounded-full"></span>
                        </button>
                        <button className="hidden md:flex w-10 h-10 items-center justify-center rounded-xl text-gray-400 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-indigo-600 transition-all">
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                {/* Dynamic Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { MarketplacePage } from './MarketplacePage';
import { StoreProfilePage } from './StoreProfilePage';
import { ClientDashboardPage } from './ClientDashboardPage';
import {
  ShoppingBag, Utensils, LayoutDashboard, CheckCircle2, Menu, X,
  TrendingUp, Users, ShieldCheck, Zap, Globe, Clock, ChevronRight,
  Star, DollarSign, Download, Play, Smartphone, Package, BarChart3,
  Store, User, LogOut
} from 'lucide-react';
import { ClientAuthModals } from './components/ClientAuthModals';
import { useClientAuthStore } from './stores/clientAuth.store';

export default function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  return (
    <div className={`min-h-screen font-outfit transition-colors duration-500 ${isDarkMode ? 'bg-secondary text-white' : 'bg-background text-text-main'}`}>
      <Routes>
        <Route path="/" element={<Home isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
        <Route path="/marketplace" element={<MarketplacePage isDarkMode={isDarkMode} />} />
        <Route path="/marketplace/store/:id" element={<StoreProfilePage isDarkMode={isDarkMode} />} />
        <Route path="/marketplace/dashboard" element={<ClientDashboardPage isDarkMode={isDarkMode} />} />
        <Route path="/precios" element={<div className="pt-32 text-center text-4xl font-black">Próximamente...</div>} />
      </Routes>
    </div>
  );
}

function Nav({ isDarkMode, setIsDarkMode }: any) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [authModal, setAuthModal] = React.useState<{ isOpen: boolean, mode: 'login' | 'register' }>({ isOpen: false, mode: 'login' });
  const { client, logout } = useClientAuthStore();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-6 transition-all duration-300">
      <div className={`max-w-7xl mx-auto rounded-[32px] flex items-center justify-between py-4 px-8 border shadow-2xl transition-all duration-500 ${isDarkMode ? 'bg-secondary/40 border-white/10 backdrop-blur-2xl' : 'bg-white/70 border-white/20 backdrop-blur-xl'}`}>
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform duration-300">
            <Utensils className="text-white" size={22} />
          </div>
          <span className={`text-2xl font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
            Resto<span className="text-primary italic">POS</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5 opacity-60">Gastronomy Suite</p>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-10">
          <a href="#features" className={`text-[11px] font-black uppercase tracking-[0.15em] transition-colors ${isDarkMode ? 'text-white/60 hover:text-primary' : 'text-text-secondary hover:text-primary'}`}>Funciones</a>
          <Link to="/marketplace" className={`text-[11px] font-black uppercase tracking-[0.15em] transition-colors flex items-center gap-2 ${isDarkMode ? 'text-white/60 hover:text-primary' : 'text-text-secondary hover:text-primary'}`}>
            <Store size={14} /> Marketplace
          </Link>
          <a href="#pricing" className={`text-[11px] font-black uppercase tracking-[0.15em] transition-colors ${isDarkMode ? 'text-white/60 hover:text-primary' : 'text-text-secondary hover:text-primary'}`}>Precios</a>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-accent hover:bg-white/10' : 'bg-gray-50 border-gray-100 text-secondary hover:bg-gray-100'}`}
          >
            {isDarkMode ? <Zap size={18} fill="currentColor" /> : <Zap size={18} />}
          </button>

          {client ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black">
                  {client.firstName.charAt(0)}
                </div>
                <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{client.firstName}</span>
              </button>

              {showProfileMenu && (
                <div className={`absolute right-0 mt-3 w-56 rounded-[24px] shadow-2xl border p-2 animate-in fade-in slide-in-from-top-2 z-50 ${isDarkMode ? 'bg-secondary border-white/10' : 'bg-white border-gray-100'}`}>
                  <div className={`px-4 py-3 border-b mb-2 ${isDarkMode ? 'border-white/10' : 'border-gray-50'}`}>
                    <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{client.firstName} {client.lastName}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>{client.email}</p>
                  </div>
                  <div className="py-2 border-b border-gray-100 dark:border-white/5">
                    <Link to="/marketplace/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-secondary dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <User size={16} className="text-primary" />
                      Mi Perfil
                    </Link>
                    <Link to="/marketplace/dashboard?tab=orders" className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-secondary dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <ShoppingBag size={16} className="text-primary" />
                      Mis Pedidos
                    </Link>
                  </div>
                  <button
                    onClick={() => { logout(); setShowProfileMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10`}
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button onClick={() => setAuthModal({ isOpen: true, mode: 'login' })} className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${isDarkMode ? 'text-white hover:text-primary' : 'text-secondary hover:text-primary'}`}>Ingresar</button>
              <button
                onClick={() => setAuthModal({ isOpen: true, mode: 'register' })}
                className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.05] hover:shadow-primary/40 active:scale-95 transition-all uppercase tracking-[0.15em]"
              >
                Registrarse
              </button>
            </>
          )}
        </div>

        <button className={`md:hidden p-2 rounded-xl border ${isDarkMode ? 'text-white border-white/10' : 'text-secondary border-gray-100'}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMenuOpen && (
        <div className={`fixed inset-0 z-[60] p-6 lg:hidden animate-in fade-in slide-in-from-top-10 duration-500 ${isDarkMode ? 'bg-secondary' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white"><Utensils size={16} /></div>
              <span className="font-black text-xl">RestoPOS</span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
          </div>
          <div className="space-y-6">
            <Link to="/marketplace" onClick={() => setIsMenuOpen(false)} className="block text-3xl font-black tracking-tight hover:text-primary transition-colors">Marketplace</Link>
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-3xl font-black tracking-tight hover:text-primary transition-colors">Funciones</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block text-3xl font-black tracking-tight hover:text-primary transition-colors">Precios</a>
            <div className="pt-12 space-y-4">
              {client ? (
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full py-4 text-center font-black rounded-2xl bg-red-50 text-red-500 uppercase tracking-widest text-xs">Cerrar Sesión</button>
              ) : (
                <>
                  <button onClick={() => { setAuthModal({ isOpen: true, mode: 'login' }); setIsMenuOpen(false); }} className="block w-full py-4 text-center font-black rounded-2xl bg-gray-100 uppercase tracking-widest text-xs">Iniciar Sesión</button>
                  <button onClick={() => { setAuthModal({ isOpen: true, mode: 'register' }); setIsMenuOpen(false); }} className="block w-full py-4 text-center font-black rounded-2xl bg-primary text-white shadow-xl uppercase tracking-widest text-xs">Crear Cuenta</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ClientAuthModals
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        initialMode={authModal.mode}
        isDarkMode={isDarkMode}
      />
    </nav>
  );
}

function Home({ isDarkMode, setIsDarkMode }: any) {
  const testimonials = [
    { name: 'Ricardo Gómez', role: 'Dueño de "La Estancia"', text: 'RestoPOS cambió totalmente la dinámica de mi salón. La integración con el menú QR redujo los tiempos de espera en un 40%.' },
    { name: 'Elena Martínez', role: 'Chef Ejecutiva', text: 'El control de inventario es milimétrico. Ahora sé exactamente mi margen real por plato al instante.' },
    { name: 'Julián Rossi', role: 'Gerente de Operaciones', text: 'Escalamos a 5 sucursales sin fricciones. La gestión centralizada desde el Dashboard es una obra de arte.' }
  ];

  return (
    <>
      <Nav isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
        <div className={`absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[150px] opacity-20 -mr-96 -mt-96 transition-colors duration-1000 ${isDarkMode ? 'bg-primary' : 'bg-primary'}`} />
        <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[150px] opacity-10 -ml-96 -mb-96 transition-colors duration-1000 ${isDarkMode ? 'bg-accent' : 'bg-accent'}`} />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-10 text-center lg:text-left z-10">
              <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full border shadow-sm animate-in slide-in-from-bottom duration-1000 ${isDarkMode ? 'bg-white/5 border-white/10 text-accent font-black text-[10px] tracking-widest uppercase' : 'bg-primary/10 border-primary/10 text-primary font-black text-[10px] tracking-widest uppercase'}`}>
                <Zap size={14} className="animate-pulse" />
                V2.4 • Estabilidad Garantizada
              </div>

              <h1 className={`text-6xl lg:text-8xl font-black leading-[0.95] tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                Eleva el Nivel de tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-accent italic">Servicio.</span>
              </h1>

              <p className={`text-xl font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>
                El sistema integral de gestión gastronómica que combina potencia transaccional con una experiencia de usuario de élite. Diseñado por y para restauradores.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
                <a
                  href="/pos/login"
                  className="px-10 py-5 rounded-[24px] font-black transition-all duration-300 bg-primary text-white shadow-xl shadow-primary/30 hover:scale-[1.08] hover:shadow-primary/50 active:scale-95 uppercase tracking-widest text-sm w-full sm:w-auto text-center"
                >
                  Explorar Demo <ChevronRight className="inline-block ml-1" size={18} />
                </a>
                <Link
                  to="/marketplace"
                  className={`px-10 py-5 rounded-[24px] font-black border-2 transition-all w-full sm:w-auto uppercase tracking-widest text-sm hover:scale-[1.05] active:scale-95 ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-100 text-secondary hover:bg-white hover:shadow-xl'}`}
                >
                  <Store className="inline-block mr-2" size={16} /> MarketPlace
                </Link>
              </div>
            </div>

            <div className="flex-1 relative z-10 animate-in zoom-in slide-in-from-right duration-1000 delay-300">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-accent/30 rounded-[48px] blur-3xl opacity-30 animate-pulse"></div>
              <div className={`relative border p-3 rounded-[48px] shadow-2xl transition-transform duration-1000 hover:rotate-2 group ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/40 backdrop-blur-md'}`}>
                <img
                  src="/hero-mockup.png"
                  alt="RestoPOS Dashboard Mockup"
                  className="w-full h-auto rounded-[36px] shadow-lg group-hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Stats Section */}
      <section className={`py-20 border-y ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              { val: '+1.5k', label: 'Restaurantes' },
              { val: '99.9%', label: 'Uptime Sistema' },
              { val: '24/7', label: 'Soporte VIP' },
              { val: '+50m', label: 'Pedidos/Año' }
            ].map((s, i) => (
              <div key={i} className="space-y-1">
                <p className="text-4xl font-black text-primary tracking-tighter">{s.val}</p>
                <p className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-text-secondary'}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20 space-y-4">
          <h2 className={`text-4xl lg:text-6xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Potencia cada Estación.</h2>
          <p className={`text-lg font-medium max-w-2xl mx-auto ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>
            Desde la recepción hasta el delivery, RestoPOS orquesta el flujo completo de tu operación gastronómica con precisión milimétrica.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: 'POS Táctil Premium', desc: 'Interfaz fluida para camareros, optimizada para tablets y laptops de alto tráfico.', icon: Smartphone, color: 'from-blue-500 to-indigo-600' },
            { title: 'Menú Digital QR', desc: 'Autogestión de pedidos en mesa. Menos errores de personal, mayor rotación de mesas.', icon: ShoppingBag, color: 'from-cyan-500 to-blue-500' },
            { title: 'Control de Almacén', desc: 'Inventario en tiempo real con alertas de stock bajo y control de costes por receta.', icon: Package, color: 'from-purple-500 to-indigo-500' },
            { title: 'Analítica en Vivo', desc: 'Decisiones basadas en datos reales. Ventas, márgenes y rendimiento del staff.', icon: BarChart3, color: 'from-orange-400 to-rose-500' },
            { title: 'Ecosistema Delivery', desc: 'Módulo integrado para repartidores propios con seguimiento geolocalizado.', icon: Globe, color: 'from-emerald-400 to-teal-600' },
            { title: 'Audit Logs', desc: 'Registro histórico de cada acción. Seguridad total ante anulaciones y descuentos.', icon: ShieldCheck, color: 'from-gray-700 to-secondary' }
          ].map((f, i) => (
            <div key={i} className={`group p-10 rounded-[40px] border shadow-sm transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/5 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-white border-gray-100 hover:border-primary/10'}`}>
              <div className={`w-16 h-16 rounded-[24px] bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-lg mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <f.icon size={30} />
              </div>
              <h3 className={`text-2xl font-black mb-4 tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{f.title}</h3>
              <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-32 px-6 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-20 text-center mx-auto space-y-6">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} className="text-yellow-400 fill-current" />)}
            </div>
            <h2 className={`text-4xl lg:text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Voces de la Industria.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className={`p-10 rounded-[40px] shadow-sm relative overflow-hidden transition-all duration-500 hover:shadow-xl group ${isDarkMode ? 'bg-secondary border border-white/10' : 'bg-white border border-gray-100'}`}>
                <div className={`text-6xl absolute -right-4 -top-4 opacity-[0.05] font-black group-hover:scale-125 transition-transform ${isDarkMode ? 'text-white' : 'text-secondary'}`}>"</div>
                <p className={`text-lg italic font-medium leading-relaxed mb-8 relative z-10 ${isDarkMode ? 'text-white/80' : 'text-secondary/80'}`}>{t.text}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white shadow-sm flex items-center justify-center font-black text-gray-400">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{t.name}</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className={`text-4xl lg:text-6xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Planes a tu Medida.</h2>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className={`p-10 rounded-[40px] border ${isDarkMode ? 'bg-secondary border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <h3 className="text-xl font-black mb-4">Esencial</h3>
            <p className="text-4xl font-black text-primary mb-6">$19 <span className="text-xs text-text-secondary">/mes</span></p>
            <button className="w-full py-4 rounded-xl bg-primary text-white font-black uppercase text-xs">Seleccionar</button>
          </div>
          <div className={`p-12 rounded-[48px] border-4 border-primary shadow-2xl scale-110 relative z-10 ${isDarkMode ? 'bg-secondary' : 'bg-white'}`}>
            <h3 className="text-2xl font-black mb-4">Pro</h3>
            <p className="text-6xl font-black text-primary mb-8">$49 <span className="text-xs text-text-secondary">/mes</span></p>
            <button className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase text-sm">Empezar Ahora</button>
          </div>
          <div className={`p-10 rounded-[40px] border ${isDarkMode ? 'bg-secondary border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <h3 className="text-xl font-black mb-4">Enterprise</h3>
            <p className="text-4xl font-black text-primary mb-6">Contactar</p>
            <button className="w-full py-4 rounded-xl border-2 border-primary text-primary font-black uppercase text-xs">Hablar con Ventas</button>
          </div>
        </div>
      </section>

      <Footer isDarkMode={isDarkMode} />
    </>
  );
}

function Footer({ isDarkMode }: any) {
  return (
    <footer className={`pt-32 pb-16 px-6 border-t ${isDarkMode ? 'bg-secondary border-white/5' : 'bg-white border-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="pt-16 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60">
          <p className="text-[10px] font-black uppercase tracking-widest">&copy; 2026 RestoPOS Technologies Inc.</p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Estado del Sistema</a>
            <a href="#" className="hover:text-primary transition-colors">Soporte</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

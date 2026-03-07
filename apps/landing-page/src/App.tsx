import React from 'react';
import { ShoppingBag, Utensils, LayoutDashboard, CheckCircle2, Menu, X } from 'lucide-react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl rounded-[32px] flex items-center justify-between !py-4 !px-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Utensils className="text-white" size={20} />
            </div>
            <span className="text-2xl font-black text-[var(--secondary)] tracking-tight">
              Resto<span className="text-primary">POS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Incio', 'Funciones', 'Precios', 'Contacto'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-text-secondary hover:text-primary transition-colors uppercase tracking-widest">{item}</a>
            ))}
            <button className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all">
              EMPEZAR GRATIS
            </button>
          </div>

          <button className="md:hidden text-secondary" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-bounce">
              <CheckCircle2 size={12} />
              El POS #1 para Restaurantes Gastronómicos
            </div>
            <h1 className="text-6xl lg:text-7xl font-black text-secondary leading-[1.05] tracking-tight">
              Moderniza tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Restaurante</span> ahora.
            </h1>
            <p className="text-xl text-text-secondary font-medium max-w-2xl mx-auto lg:mx-0">
              Gestiona ventas, pedidos por QR, cocina y reportes financieros desde una sola plataforma premium diseñada para crecer tu negocio.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button className="px-8 py-4 rounded-2xl font-black transition-all duration-300 bg-primary text-white shadow-[0_8px_16px_rgba(0,48,173,0.2)] hover:scale-[1.05] hover:shadow-[0_12px_24px_rgba(0,48,173,0.3)] active:scale-95 uppercase tracking-wider text-sm w-full sm:w-auto">Hacer Demo Gratis</button>
              <button className="px-8 py-4 rounded-2xl font-bold text-secondary border-2 border-gray-100 hover:bg-white hover:shadow-md transition-all w-full sm:w-auto uppercase tracking-wider text-sm">Ver Precios</button>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
              {/* Logos de confianza simulados */}
              <div className="font-black text-xl">GASTRO_TECH</div>
              <div className="font-black text-xl">FOOD_CORP</div>
              <div className="font-black text-xl">CHEF_PRO</div>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-[100px]" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-[100px]" />
            <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl rounded-[32px] p-1 transition-transform duration-700 hover:rotate-1">
              <div className="bg-gradient-to-br from-secondary to-primary rounded-[28px] p-6 text-white space-y-8 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest opacity-60">Ingresos Hoy</p>
                    <p className="text-3xl font-black">$45,280.00</p>
                  </div>
                  <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold text-accent">+12.5%</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag size={14} className="text-accent" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Pedidos QR</span>
                    </div>
                    <p className="text-xl font-black">128</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <LayoutDashboard size={14} className="text-accent" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Mesas Activas</span>
                    </div>
                    <p className="text-xl font-black">14/20</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/10 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/20" />
                      <span className="text-xs font-bold">Pizza Margherita x2</span>
                    </div>
                    <span className="text-xs font-black text-accent">COCINANDO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Simple Banner */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: 'POS Veloz', desc: 'Gestiona ventas en segundos con una interfaz táctil optimizada.', icon: Utensils },
            { title: 'Menú QR', desc: 'Permite que tus clientes pidan desde su mesa sin esperar.', icon: ShoppingBag },
            { title: 'Administración', desc: 'Control total de inventario, personal y finanzas.', icon: LayoutDashboard },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-background text-primary rounded-2xl flex items-center justify-center shadow-sm">
                <f.icon size={24} />
              </div>
              <h3 className="text-xl font-black text-secondary">{f.title}</h3>
              <p className="text-text-secondary font-medium text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

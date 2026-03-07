import React from 'react';
import {
  ShoppingBag, Utensils, LayoutDashboard, CheckCircle2, Menu, X,
  TrendingUp, Users, ShieldCheck, Zap, Globe, Clock, ChevronRight,
  Star, DollarSign, Download, Play, Smartphone, Package, BarChart3
} from 'lucide-react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const testimonials = [
    { name: 'Ricardo Gómez', role: 'Dueño de "La Estancia"', text: 'RestoPOS cambió totalmente la dinámica de mi salón. La integración con el menú QR redujo los tiempos de espera en un 40%.' },
    { name: 'Silvia Torres', role: 'Manager en Gourmet Link', text: 'El dashboard financiero es impresionante. Tengo control real sobre mis márgenes por primera vez en años.' },
    { name: 'Marcos Ruiz', role: 'Chef Ejecutivo', text: 'La terminal de cocina (KDS) es intuitiva y robusta. Mis cocineros aman la claridad que aporta al flujo de trabajo.' }
  ];

  return (
    <div className={`min-h-screen font-outfit transition-colors duration-500 ${isDarkMode ? 'bg-secondary text-white' : 'bg-background text-text-main'}`}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 transition-all duration-300">
        <div className={`max-w-7xl mx-auto rounded-[32px] flex items-center justify-between py-4 px-8 border shadow-2xl transition-all duration-500 ${isDarkMode ? 'bg-secondary/40 border-white/10 backdrop-blur-2xl' : 'bg-white/70 border-white/20 backdrop-blur-xl'}`}>
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform duration-300">
              <Utensils className="text-white" size={22} />
            </div>
            <span className={`text-2xl font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
              Resto<span className="text-primary italic">POS</span>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5 opacity-60">Gastronomy Suite</p>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {['Funciones', 'Soluciones', 'Precios', 'Compañía'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className={`text-[11px] font-black uppercase tracking-[0.15em] transition-colors ${isDarkMode ? 'text-white/60 hover:text-primary' : 'text-text-secondary hover:text-primary'}`}>{item}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-accent hover:bg-white/10' : 'bg-gray-50 border-gray-100 text-secondary hover:bg-gray-100'}`}
            >
              {isDarkMode ? <Zap size={18} fill="currentColor" /> : <Zap size={18} />}
            </button>
            <a href="/pos/login" className={`text-xs font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white hover:text-primary' : 'text-secondary hover:text-primary'}`}>Ingresar</a>
            <a
              href="/pos/login"
              className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20 hover:scale-[1.05] hover:shadow-primary/40 active:scale-95 transition-all uppercase tracking-widest"
            >
              Prueba Gratuita
            </a>
          </div>

          <button className={`md:hidden p-2 rounded-xl border ${isDarkMode ? 'text-white border-white/10' : 'text-secondary border-gray-100'}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
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
            {['Funciones', 'Soluciones', 'Precios', 'Compañía'].map((item) => (
              <a key={item} href="#" className="block text-3xl font-black tracking-tight hover:text-primary transition-colors">{item}</a>
            ))}
            <div className="pt-12 space-y-4">
              <a href="/pos/login" className="block w-full py-4 text-center font-black rounded-2xl bg-gray-100 uppercase tracking-widest text-xs">Iniciar Sesión</a>
              <a href="/pos/login" className="block w-full py-4 text-center font-black rounded-2xl bg-primary text-white shadow-xl uppercase tracking-widest text-xs">Crear Cuenta</a>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
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
                <button
                  className={`px-10 py-5 rounded-[24px] font-black border-2 transition-all w-full sm:w-auto uppercase tracking-widest text-sm hover:scale-[1.05] active:scale-95 ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-100 text-secondary hover:bg-white hover:shadow-xl'}`}
                >
                  <Play className="inline-block mr-2 fill-current" size={16} /> Ver Video
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-10 pt-12 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
                <div className="flex items-center gap-2 font-black text-lg"><ShieldCheck size={20} /> ISO_SECURE</div>
                <div className="flex items-center gap-2 font-black text-lg"><Globe size={20} /> GLOBAL_FOOD</div>
                <div className="flex items-center gap-2 font-black text-lg"><Zap size={20} /> LIGHTNING_TRANS</div>
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
                {/* Floating Stats Decoration */}
                <div className="absolute -left-10 bottom-20 bg-white dark:bg-secondary p-5 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 animate-bounce transition-all duration-1000 hover:scale-110 cursor-default hidden xl:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success"><TrendingUp size={20} /></div>
                    <div>
                      <p className="text-[10px] font-black text-text-secondary uppercase">Margen Hoy</p>
                      <p className="text-lg font-black text-secondary dark:text-white">+24.8%</p>
                    </div>
                  </div>
                </div>
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
      <section className="py-32 px-6">
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
              <div className="mt-8">
                <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] group-hover:underline flex items-center gap-2">Explorar Módulo <ChevronRight size={14} /></button>
              </div>
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

      {/* Pricing Section */}
      <section id="precios" className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className={`text-4xl lg:text-6xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Planes a tu Medida.</h2>
          <p className={`text-lg font-medium mt-4 ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>Sin contratos forzosos. Cancela cuando quieras.</p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Plan 1 */}
          <div className={`p-10 rounded-[40px] border transition-all duration-500 hover:scale-105 ${isDarkMode ? 'bg-secondary border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Esencial</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-primary">$19</span>
              <span className="text-xs font-bold text-text-secondary uppercase">/mes</span>
            </div>
            <ul className="space-y-4 mb-10">
              {['1 Terminal POS', 'Pedidos QR Ilimitados', 'Gestión de Inventario Base', 'Reportes Diarios'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium opacity-80"><CheckCircle2 className="text-success" size={16} /> {item}</li>
              ))}
            </ul>
            <button className="w-full py-4 rounded-2xl border-2 border-gray-100 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">Seleccionar</button>
          </div>

          {/* Plan 2 - Featured */}
          <div className={`p-12 rounded-[48px] border-4 border-primary shadow-2xl scale-[1.1] relative z-10 ${isDarkMode ? 'bg-secondary' : 'bg-white'}`}>
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Más Recomendado</div>
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Full Gastronomy</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-6xl font-black text-primary">$49</span>
              <span className="text-xs font-bold text-text-secondary uppercase">/mes</span>
            </div>
            <ul className="space-y-5 mb-12">
              {['Terminales Ilimitadas', 'Gestión Multi-Sucursal', 'Módulo KDS Pantallas', 'Ecosistema Delivery Pro', 'Soporte VIP 24/7'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-base font-black tracking-tight"><CheckCircle2 className="text-primary" size={20} /> {item}</li>
              ))}
            </ul>
            <a href="/pos/login" className="block w-full py-5 rounded-[24px] bg-primary text-white text-center font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all">Empezar Ahora</a>
          </div>

          {/* Plan 3 */}
          <div className={`p-10 rounded-[40px] border transition-all duration-500 hover:scale-105 ${isDarkMode ? 'bg-secondary border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Corporativo</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-primary">Precios</span>
            </div>
            <p className="text-sm font-medium opacity-60 mb-8 leading-relaxed">Soluciones personalizadas para cadenas de restaurantes y hoteles con necesidades complejas.</p>
            <ul className="space-y-4 mb-10">
              {['Infraestructura Dedicada', 'API Full Access', 'Consultoría On-Site', 'SLA de Respuesta < 1h'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium opacity-80"><CheckCircle2 className="text-success" size={16} /> {item}</li>
              ))}
            </ul>
            <button className="w-full py-4 rounded-2xl border-2 border-gray-100 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">Hablar con Ventas</button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-secondary to-primary rounded-[56px] p-16 lg:p-24 text-center text-white relative overflow-hidden shadow-[0_40px_100px_rgba(0,74,173,0.3)]">
          {/* Decorative light */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-10 rounded-full blur-[100px] -mr-40 -mt-40"></div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-10">
            <h2 className="text-5xl lg:text-7xl font-black tracking-tight leading-none">Únete a la Élite de la <span className="text-accent italic">Gastronomía.</span></h2>
            <p className="text-xl opacity-80 font-medium">Libera el potencial de tu negocio con la tecnología más avanzada del mercado.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <a href="/pos/login" className="px-12 py-5 rounded-[24px] bg-white text-secondary font-black uppercase tracking-widest text-sm shadow-2xl hover:scale-110 active:scale-95 transition-all">Comienza tu Demo</a>
              <button className="px-12 py-5 rounded-[24px] bg-transparent border-2 border-white/20 font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-all">Nuestros Casos de Éxito</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`pt-32 pb-16 px-6 border-t ${isDarkMode ? 'bg-secondary border-white/5' : 'bg-white border-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"><Utensils className="text-white" size={20} /></div>
                <span className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>RestoPOS</span>
              </div>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white/40' : 'text-text-secondary'}`}>
                Redefiniendo el estándar operacional de la industria gastronómica global a través de innovación constante y diseño centrado en el usuario.
              </p>
              <div className="flex gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className={`w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer ${isDarkMode ? 'border-white/10 text-white/40' : 'border-gray-100 text-gray-400'}`}><Zap size={18} /></div>)}
              </div>
            </div>

            {[
              { title: 'Plataforma', links: ['Dashboard POS', 'Gestión QR', 'Kitchen System', 'Inventory Plus'] },
              { title: 'Compañía', links: ['Sobre Nosotros', 'Blog Gastronómico', 'Trabaja con Nosotros', 'Prensa'] },
              { title: 'Legal', links: ['Privacidad', 'Términos de Servicio', 'Cookies', 'Licencias'] }
            ].map((group, i) => (
              <div key={i} className="space-y-8">
                <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{group.title}</h4>
                <ul className="space-y-4">
                  {group.links.map(link => (
                    <li key={link}><a href="#" className={`text-sm font-medium hover:text-primary transition-colors ${isDarkMode ? 'text-white/40' : 'text-text-secondary'}`}>{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-16 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60">
            <p className="text-[10px] font-black uppercase tracking-widest">&copy; 2026 RestoPOS Technologies Inc. • Engineered with Passion.</p>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
              <a href="#" className="hover:text-primary transition-colors">Estado del Sistema</a>
              <a href="#" className="hover:text-primary transition-colors">Soporte</a>
              <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

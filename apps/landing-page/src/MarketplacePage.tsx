import React, { useState, useEffect } from 'react';
import {
    Search, Filter, MapPin, Store, ArrowRight, Utensils,
    Pizza, Coffee, Sandwich, IceCream, Star, Clock, Phone,
    ShoppingBag, LogOut, User, Zap, Menu, X, ChevronRight,
    Facebook, Instagram, Twitter, MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from './api';
import { useClientAuthStore } from './stores/clientAuth.store';
import { ClientAuthModals } from './components/ClientAuthModals';

export function MarketplacePage({ isDarkMode }: { isDarkMode: boolean }) {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todos');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [authModal, setAuthModal] = useState<{ isOpen: boolean, mode: 'login' | 'register' }>({ isOpen: false, mode: 'login' });
    const { client, logout } = useClientAuthStore();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const categories = [
        { name: 'Todos', icon: Utensils },
        { name: 'Pizza', icon: Pizza },
        { name: 'Burgers', icon: Sandwich },
        { name: 'Café', icon: Coffee },
        { name: 'Postres', icon: IceCream },
    ];

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const { data } = await api.get('/marketplace/branches');
            setBranches(data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBranches = branches.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Todos' || b.categories?.some((c: any) => c.name.includes(activeCategory));
        return matchesSearch && matchesCategory;
    });

    return (
        <div className={`min-h-screen font-outfit transition-colors duration-500 ${isDarkMode ? 'bg-secondary' : 'bg-[#F4F7FE]'}`}>
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 px-6 py-6 transition-all duration-300">
                <div className={`max-w-7xl mx-auto rounded-[32px] flex items-center justify-between py-4 px-8 border shadow-2xl transition-all duration-500 ${isDarkMode ? 'bg-secondary/40 border-white/10 backdrop-blur-2xl' : 'bg-white/70 border-white/20 backdrop-blur-xl'}`}>
                    <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform duration-300">
                            <Utensils className="text-white" size={22} />
                        </div>
                        <div className="hidden sm:block">
                            <span className={`text-2xl font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                Resto<span className="text-primary italic">POS</span>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5 opacity-60">Marketplace</p>
                            </span>
                        </div>
                    </Link>

                    <div className="hidden lg:flex items-center gap-10">
                        <Link to="/" className={`text-[11px] font-black uppercase tracking-[0.15em] transition-colors ${isDarkMode ? 'text-white/60 hover:text-primary' : 'text-text-secondary hover:text-primary'}`}>Inicio</Link>
                        <Link to="/marketplace" className="text-[11px] font-black uppercase tracking-[0.15em] text-primary flex items-center gap-2">
                            Explorar
                        </Link>
                        <a href="#footer" className={`text-[11px] font-black uppercase tracking-[0.15em] transition-colors ${isDarkMode ? 'text-white/60 hover:text-primary' : 'text-text-secondary hover:text-primary'}`}>Soporte</a>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        {client ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black">
                                        {client.firstName.charAt(0)}
                                    </div>
                                    <span className={`text-sm font-bold hidden md:block ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{client.firstName}</span>
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
                                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-2xl font-black text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.05] hover:shadow-primary/40 transition-all uppercase tracking-[0.15em]"
                                >
                                    Registrarse
                                </button>
                            </>
                        )}
                        <button className="lg:hidden p-2 rounded-xl border border-gray-100 dark:border-white/10" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
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
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full dark:bg-white/10"><X size={20} /></button>
                    </div>
                    <div className="space-y-6">
                        <Link to="/" onClick={() => setIsMenuOpen(false)} className="block text-3xl font-black tracking-tight hover:text-primary transition-colors">Inicio</Link>
                        <Link to="/marketplace" onClick={() => setIsMenuOpen(false)} className="block text-3xl font-black tracking-tight text-primary">Marketplace</Link>
                        <a href="#footer" onClick={() => setIsMenuOpen(false)} className="block text-3xl font-black tracking-tight hover:text-primary transition-colors">Soporte</a>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                {/* Background Image & Overlay */}
                <div className="absolute inset-x-0 top-0 h-[600px] z-0">
                    <img
                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80"
                        className="w-full h-full object-cover"
                        alt="Restaurante background"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent ${isDarkMode ? 'to-secondary' : 'to-[#F4F7FE]'}`} />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 text-center space-y-8">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white font-black text-[10px] tracking-widest uppercase shadow-2xl">
                        <Zap size={14} className="text-primary animate-pulse" />
                        Descubre Sabores Cerca de Ti
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tighter">
                        Explora el <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-accent italic">Gastro-Universo.</span>
                    </h1>

                    <p className="text-lg md:text-xl font-medium text-white/80 max-w-2xl mx-auto leading-relaxed">
                        Conectamos a los mejores restaurantes con los paladares más exigentes. Pide directo, sin comisiones ocultas y con calidad garantizada.
                    </p>

                    {/* Search Bar in Hero */}
                    <div className="mt-12 max-w-3xl mx-auto">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={24} />
                            <input
                                type="text"
                                placeholder="¿Qué quieres comer hoy? (Ej: Pizza, Burger...)"
                                className="w-full pl-16 pr-8 py-6 rounded-[32px] border-none shadow-2xl bg-white text-secondary text-lg font-bold placeholder:text-gray-400 focus:ring-8 focus:ring-primary/20 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="absolute right-3 top-3 bottom-0 px-8 py-3 bg-primary text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/30 hover:scale-[1.05] transition-all hidden sm:block">
                                Buscar
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 sm:px-8 -mt-10 relative z-20 space-y-12">
                {/* Categories Wrapper */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className={`flex p-2 rounded-[32px] border shadow-xl transition-all duration-500 overflow-x-auto no-scrollbar max-w-full ${isDarkMode ? 'bg-secondary/40 border-white/10 backdrop-blur-xl' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`flex items-center gap-3 px-6 py-4 rounded-[24px] text-sm font-black transition-all whitespace-nowrap ${activeCategory === cat.name
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                    : isDarkMode ? 'text-white/60 hover:text-white' : 'text-secondary/60 hover:text-secondary'
                                    }`}
                            >
                                <cat.icon size={18} className={activeCategory === cat.name ? '' : 'text-primary'} /> {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-text-secondary'}`}>
                            {filteredBranches.length} Restaurantes Encontrados
                        </span>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={`h-[450px] rounded-[48px] bg-white animate-pulse ${isDarkMode ? 'opacity-5' : 'opacity-100'}`} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                        {filteredBranches.map((branch) => {
                            const settings = branch.settings || {};
                            return (
                                <div key={branch.id} className={`group relative rounded-[48px] border transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 overflow-hidden ${isDarkMode ? 'bg-secondary border-white/10 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10' : 'bg-white border-gray-100 hover:border-primary/10 shadow-card hover:shadow-2xl shadow-gray-200/50'
                                    }`}>
                                    {/* Header Image */}
                                    <div className="h-48 w-full relative overflow-hidden">
                                        <img
                                            src={branch.bannerUrl || settings.headerUrl || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80'}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            alt={branch.name}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                        {/* Logo and Status Floating */}
                                        <div className="absolute top-6 left-6 flex items-center gap-3">
                                            <div className="w-14 h-14 rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-white group-hover:rotate-6 transition-transform">
                                                <img
                                                    src={settings.logoUrl || 'https://via.placeholder.com/100'}
                                                    className="w-full h-full object-cover"
                                                    alt="logo"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg">
                                                    Abierto
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-6">
                                        <div className="flex justify-between items-start pt-2">
                                            <h3 className={`text-2xl font-black italic tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                                {branch.name}
                                            </h3>
                                            <div className="flex items-center gap-1 bg-amber-400 text-white px-3 py-1 rounded-full shadow-lg">
                                                <Star size={12} className="fill-current" />
                                                <span className="text-[10px] font-black uppercase">
                                                    {branch.avgRating?.toFixed(1) || '5.0'}
                                                </span>
                                            </div>
                                        </div>

                                        <p className={`text-sm font-medium leading-relaxed line-clamp-2 min-h-[40px] ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>
                                            {settings.description || 'Una experiencia gastronómica excepcional en un ambiente inmejorable.'}
                                        </p>

                                        <div className={`flex items-center gap-3 text-xs font-bold ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                                <MapPin size={16} />
                                            </div>
                                            <span className="truncate">{branch.address || 'Ubicación no disponible'}</span>
                                        </div>

                                        {/* Categories */}
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {branch.categories?.slice(0, 3).map((cat: any) => (
                                                <span key={cat.id} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors ${isDarkMode ? 'bg-white/5 text-white/40 group-hover:bg-primary/20 group-hover:text-primary' : 'bg-gray-100 text-gray-500 group-hover:bg-primary/5 group-hover:text-primary'}`}>
                                                    {cat.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`px-8 pb-8 pt-6 border-t flex items-center justify-between gap-4 ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                            {branch.reviewCount || Math.floor(Math.random() * 50)} Reseñas
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Link
                                                to={`/marketplace/store/${branch.id}`}
                                                className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/50 hover:scale-[1.05] transition-all"
                                            >
                                                Ver Menú <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {filteredBranches.length === 0 && !loading && (
                    <div className="text-center py-32 space-y-8">
                        <div className="w-32 h-32 bg-primary/10 rounded-[48px] flex items-center justify-center text-primary mx-auto animate-bounce">
                            <Utensils size={56} />
                        </div>
                        <div className="space-y-4">
                            <h3 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Sin coincidencias gastro-astronómicas</h3>
                            <p className={`text-lg font-medium max-w-sm mx-auto ${isDarkMode ? 'text-white/40' : 'text-text-secondary'}`}>
                                Ajusta tus filtros o busca otro nombre. ¡Hay todo un universo por descubrir!
                            </p>
                        </div>
                        <button
                            onClick={() => { setSearchTerm(''); setActiveCategory('Todos') }}
                            className="px-8 py-4 bg-white text-secondary rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl border border-gray-100 hover:bg-gray-50 transition-all"
                        >
                            Limpiar Búsqueda
                        </button>
                    </div>
                )}
            </main>

            {/* Premium Footer */}
            <footer id="footer" className={`pt-48 pb-16 px-6 border-t relative overflow-hidden ${isDarkMode ? 'bg-secondary border-white/5' : 'bg-white border-gray-50'}`}>
                <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-10 -mr-48 -mt-48 bg-primary animate-pulse`} />
                <div className={`absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-[100px] opacity-10 -ml-32 -mb-32 bg-accent`} />

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-16 relative z-10">
                    <div className="lg:col-span-1 space-y-8">
                        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform duration-300">
                                <Utensils className="text-white" size={24} />
                            </div>
                            <span className={`text-3xl font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                Resto<span className="text-primary italic">POS</span>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 opacity-60">Gastronomy Suite</p>
                            </span>
                        </Link>
                        <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>
                            Transformando la industria gastronómica con tecnología de élite y diseño centrado en el ser humano.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Instagram, Twitter, MessageCircle].map((Icon, i) => (
                                <a key={i} href="#" className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all hover:scale-110 hover:text-primary ${isDarkMode ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-gray-100 text-gray-400 hover:bg-gray-50 hover:shadow-lg'}`}>
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:col-span-3 gap-12">
                        <div className="space-y-6">
                            <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Marketplace</h4>
                            <ul className="space-y-4">
                                {['Restaurantes', 'Promociones', 'Novedades', 'Categorías'].map(item => (
                                    <li key={item}><a href="#" className={`text-sm font-bold transition-colors hover:text-primary ${isDarkMode ? 'text-white/80' : 'text-secondary/80'}`}>{item}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Sistema</h4>
                            <ul className="space-y-4">
                                {['Para Negocios', 'Precios', 'Demo POS', 'Seguridad'].map(item => (
                                    <li key={item}><a href="#" className={`text-sm font-bold transition-colors hover:text-primary ${isDarkMode ? 'text-white/80' : 'text-secondary/80'}`}>{item}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-6 col-span-2 md:col-span-1">
                            <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Newsletter</h4>
                            <div className="space-y-4">
                                <p className={`text-xs font-medium leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>Suscríbete para recibir ofertas y noticias exclusivas.</p>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="Tu email"
                                        className={`w-full px-4 py-3 rounded-xl border-none text-xs font-bold ${isDarkMode ? 'bg-white/5 text-white placeholder:text-white/30' : 'bg-gray-100 text-secondary'}`}
                                    />
                                    <button className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-110 transition-all">
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto mt-24 pt-16 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60">
                    <p className="text-[10px] font-black uppercase tracking-widest">&copy; 2026 RestoPOS Technologies Inc. • Built with Passion</p>
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
                        <a href="#" className="hover:text-primary transition-colors">Términos de Servicio</a>
                        <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-primary transition-colors">Legal</a>
                    </div>
                </div>
            </footer>

            <ClientAuthModals
                isOpen={authModal.isOpen}
                onClose={() => setAuthModal({ ...authModal, isOpen: false })}
                initialMode={authModal.mode}
                isDarkMode={isDarkMode}
            />
        </div>
    );
}

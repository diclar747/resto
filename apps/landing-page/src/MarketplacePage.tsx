import React, { useState, useEffect } from 'react';
import {
    Search, Filter, MapPin, Store, ArrowRight, Utensils,
    Pizza, Coffee, Sandwich, IceCream, Star, Clock, Phone
} from 'lucide-react';
import api from './api'; // Assuming there is an axios instance

export function MarketplacePage({ isDarkMode }: { isDarkMode: boolean }) {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todos');

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
        const matchesCategory = activeCategory === 'Todos' || b.categories.some((c: any) => c.name.includes(activeCategory));
        return matchesSearch && matchesCategory;
    });

    return (
        <div className={`min-h-screen pt-24 pb-20 px-4 md:px-8 transition-colors duration-500 ${isDarkMode ? 'bg-secondary' : 'bg-[#F4F7FE]'}`}>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className={`text-4xl md:text-6xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                        Explora el <span className="text-primary">Marketplace</span>
                    </h1>
                    <p className={`text-lg font-medium max-w-2xl mx-auto ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>
                        Descubre los mejores sabores locales, pide directo al restaurante y disfruta de una experiencia gastronómica sin intermediarios.
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex p-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-[32px] w-full md:w-auto overflow-x-auto no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-[24px] text-sm font-black transition-all whitespace-nowrap ${activeCategory === cat.name
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                    : isDarkMode ? 'text-white/60 hover:text-white' : 'text-secondary/60 hover:text-secondary'
                                    }`}
                            >
                                <cat.icon size={18} /> {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Busca tu restaurante favorito..."
                            className={`w-full pl-14 pr-6 py-4 rounded-[32px] border-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-bold ${isDarkMode ? 'bg-white/5 text-white placeholder:text-white/30' : 'bg-white text-secondary shadow-card'
                                }`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Results Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-80 rounded-[48px] bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredBranches.map((branch) => {
                            const settings = branch.settings || {};
                            return (
                                <div key={branch.id} className={`group relative rounded-[48px] border transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-primary/30' : 'bg-white border-gray-100 hover:border-primary/10 shadow-sm'
                                    }`}>
                                    {/* Header Image */}
                                    <div className="h-40 w-full relative overflow-hidden">
                                        <img
                                            src={settings.headerUrl || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80'}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            alt={branch.name}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-4 left-6 flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-lg overflow-hidden bg-white">
                                                <img
                                                    src={settings.logoUrl || 'https://via.placeholder.com/100'}
                                                    className="w-full h-full object-cover"
                                                    alt="logo"
                                                />
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white`}>
                                                Abierto
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`text-2xl font-black italic tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                                {branch.name}
                                            </h3>
                                            <div className="flex items-center gap-1 bg-amber-400/10 px-3 py-1 rounded-full">
                                                <Star size={14} className="text-amber-400 fill-amber-400" />
                                                <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                                    {branch.avgRating?.toFixed(1) || '5.0'}
                                                </span>
                                            </div>
                                        </div>

                                        <p className={`text-xs font-medium leading-relaxed line-clamp-2 ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>
                                            {settings.description || 'Una experiencia gastronómica única te espera en este local.'}
                                        </p>

                                        <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                                            <MapPin size={16} className="text-primary" />
                                            <span className="truncate">{branch.address || 'Ubicación no disponible'}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {branch.categories?.map((cat: any) => (
                                                <span key={cat.id} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-400'}`}>
                                                    {cat.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="px-8 pb-8 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                            {branch.reviewCount || 0} Calificaciones
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {branch.phone && (
                                                <a
                                                    href={`https://wa.me/${branch.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${branch.name}, vengo del Marketplace de RestoPOS y me gustaría hacer un pedido.`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'bg-white/5 text-emerald-400 hover:bg-white/10' : 'bg-success/10 text-success hover:bg-success/20'}`}
                                                >
                                                    <Phone size={18} />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => window.open(`http://localhost:5175/mesa/MP-${branch.id}`, '_blank')}
                                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-outfit"
                                            >
                                                Ver Menú <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {filteredBranches.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary mx-auto mb-6">
                            <Search size={48} />
                        </div>
                        <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>No encontramos resultados</h3>
                        <p className="text-text-secondary mt-2">Prueba con otro término o categoría.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

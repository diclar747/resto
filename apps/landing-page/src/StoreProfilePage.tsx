import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    MapPin, ArrowLeft, Star, Phone, Instagram, Facebook, Globe, Clock, Utensils
} from 'lucide-react';
import api from './api';

export function StoreProfilePage({ isDarkMode }: { isDarkMode: boolean }) {
    const { id } = useParams();
    const [branch, setBranch] = useState<any>(null);
    const [menu, setMenu] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchStoreData();
    }, [id]);

    const fetchStoreData = async () => {
        try {
            // In a real app we might want a specific endpoint for the branch details
            // But for now we can fetch all and find it (since it's a small dataset)
            const branchRes = await api.get('/marketplace/branches');
            const foundBranch = branchRes.data.find((b: any) => b.id === id);
            setBranch(foundBranch);

            if (foundBranch) {
                const menuRes = await api.get(`/marketplace/branches/${id}/menu`);
                setMenu(menuRes.data);
            }
        } catch (error) {
            console.error('Error fetching store info:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen pt-32 px-4 flex justify-center ${isDarkMode ? 'bg-secondary' : 'bg-[#F4F7FE]'}`}>
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!branch) {
        return (
            <div className={`min-h-screen pt-40 px-4 text-center flex flex-col items-center ${isDarkMode ? 'bg-secondary text-white' : 'bg-[#F4F7FE] text-secondary'}`}>
                <h1 className="text-4xl font-black mb-4">Restaurante no encontrado</h1>
                <Link to="/marketplace" className="text-primary font-bold hover:underline">Volver al Marketplace</Link>
            </div>
        );
    }

    const settings = branch.settings || {};

    return (
        <div className={`min-h-screen pb-20 transition-colors duration-500 ${isDarkMode ? 'bg-secondary' : 'bg-[#F4F7FE]'}`}>

            {/* Header Banner */}
            <div className="w-full h-80 md:h-[450px] relative">
                <img
                    src={branch.bannerUrl || settings.headerUrl || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80'}
                    className="w-full h-full object-cover"
                    alt={branch.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Back Button */}
                <div className="absolute top-28 left-4 md:left-12 z-10">
                    <Link to="/marketplace" className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-2xl font-black text-sm transition-all rounded-full">
                        <ArrowLeft size={18} /> Marketplace
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-24 md:-mt-32 relative z-20">
                <div className={`rounded-[48px] p-8 md:p-12 shadow-2xl mb-12 border transition-all ${isDarkMode ? 'bg-surface border-white/5' : 'bg-white border-gray-100'}`}>

                    {/* Store Identity */}
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border-b border-gray-100 dark:border-white/5 pb-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                            <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white shrink-0">
                                <img
                                    src={settings.logoUrl || 'https://via.placeholder.com/200'}
                                    className="w-full h-full object-cover"
                                    alt="logo"
                                />
                            </div>
                            <div className="space-y-3 pt-2">
                                <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                    {branch.name}
                                </h1>
                                <p className={`text-sm md:text-base font-medium max-w-2xl ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>
                                    {settings.description || 'Una experiencia gastronómica única te espera en este local.'}
                                </p>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-1.5 bg-amber-400/10 px-4 py-1.5 rounded-full">
                                        <Star size={16} className="text-amber-400 fill-amber-400" />
                                        <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                            {branch.avgRating?.toFixed(1) || '5.0'}
                                        </span>
                                        <span className="text-[10px] font-black uppercase text-amber-400/60 ml-1">({branch.reviewCount || 0})</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-text-secondary bg-gray-100 dark:bg-white/5 px-4 py-1.5 rounded-full">
                                        <MapPin size={16} className="text-primary" />
                                        <span>{branch.address || 'Ubicación no disponible'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social & Contact Actions */}
                        <div className="w-full md:w-auto flex flex-wrap gap-3 justify-center">
                            {(branch.whatsapp || branch.phone) && (
                                <a href={`https://wa.me/${(branch.whatsapp || branch.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${branch.name}, vengo del Marketplace de RestoPOS y me gustaría hacer un pedido.`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-1">
                                    <Phone size={16} /> WhatsApp
                                </a>
                            )}
                            {settings.googleMapsUrl && (
                                <a href={settings.googleMapsUrl} target="_blank" rel="noreferrer" className="p-4 bg-blue-50 hover:bg-blue-100 text-blue-500 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-2xl shadow-sm transition-all hover:-translate-y-1" title="Ver en Google Maps">
                                    <MapPin size={20} />
                                </a>
                            )}
                            {settings.instagramUrl && (
                                <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="p-4 bg-pink-50 hover:bg-pink-100 text-pink-500 dark:bg-pink-500/10 dark:hover:bg-pink-500/20 rounded-2xl shadow-sm transition-all hover:-translate-y-1" title="Instagram">
                                    <Instagram size={20} />
                                </a>
                            )}
                            {settings.facebookUrl && (
                                <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-500 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-2xl shadow-sm transition-all hover:-translate-y-1" title="Facebook">
                                    <Facebook size={20} />
                                </a>
                            )}
                            {settings.tiktokUrl && (
                                <a href={settings.tiktokUrl} target="_blank" rel="noreferrer" className={`p-4 rounded-2xl shadow-sm transition-all hover:-translate-y-1 ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`} title="TikTok">
                                    <Utensils size={20} /> {/* TikTok icon workaround using Utensils or Globe */}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Menu Section */}
                    <div className="pt-12">
                        <div className="flex items-center gap-3 mb-10">
                            <Utensils className="text-primary" size={28} />
                            <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                Menú Digital
                            </h2>
                        </div>

                        {menu.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[32px]">
                                <Utensils size={40} className="mx-auto mb-4 text-gray-300 dark:text-white/20" />
                                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Aún no hay platos publicados</h3>
                                <p className="text-text-secondary mt-2">Vuelve pronto para descubrir sus delicias.</p>
                            </div>
                        ) : (
                            <div className="space-y-16">
                                {menu.map((category) => (
                                    <div key={category.id}>
                                        <h3 className={`text-2xl font-black mb-8 pb-4 border-b uppercase tracking-widest ${isDarkMode ? 'text-white border-white/10' : 'text-secondary border-gray-100'}`}>
                                            {category.name}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {category.products.map((product: any) => {
                                                const defaultVariant = product.variants?.find((v: any) => v.isDefault) || product.variants?.[0];
                                                const price = defaultVariant ? defaultVariant.price : 0;

                                                return (
                                                    <div key={product.id} className={`group flex gap-4 p-4 rounded-3xl border transition-all hover:shadow-xl ${isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-gray-100 hover:border-primary/10'}`}>
                                                        <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                                                            {product.imageUrl ? (
                                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300"><Utensils size={24} /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col justify-center flex-1">
                                                            <h4 className={`font-black text-lg leading-tight mb-1 ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                                                {product.name}
                                                            </h4>
                                                            <p className={`text-xs line-clamp-2 mb-3 ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>
                                                                {product.description || 'Delicioso plato preparado con los mejores ingredientes.'}
                                                            </p>
                                                            <div className="font-black text-primary text-lg mt-auto">
                                                                Gs. {Number(price).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


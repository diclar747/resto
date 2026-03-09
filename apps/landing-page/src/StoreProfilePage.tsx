import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    MapPin, ArrowLeft, Star, Phone, Instagram, Facebook, Globe, Clock, Utensils,
    Search, ShoppingBag, Plus, Minus, X, MessageSquare, AlertTriangle
} from 'lucide-react';
import api from './api';
import { useMarketplaceCartStore } from './stores/marketplaceCart.store';

export function StoreProfilePage({ isDarkMode }: { isDarkMode: boolean }) {
    const { id } = useParams();
    const [branch, setBranch] = useState<any>(null);
    const [menu, setMenu] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const cart = useMarketplaceCartStore();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const [reviews, setReviews] = useState<any[]>([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const [alertMessage, setAlertMessage] = useState<string | null>(null);

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
                const [menuRes, reviewsRes] = await Promise.all([
                    api.get(`/marketplace/branches/${id}/menu`),
                    api.get(`/marketplace/branches/${id}/reviews`)
                ]);
                setMenu(menuRes.data);
                setReviews(reviewsRes.data);
            }
        } catch (error) {
            console.error('Error fetching store info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        const tokenString = localStorage.getItem('client-auth-storage');
        let tokenExists = false;
        if (tokenString) {
            try {
                const parsed = JSON.parse(tokenString);
                if (parsed?.state?.token) tokenExists = true;
            } catch (e) { }
        }

        if (!tokenExists) {
            setAlertMessage('Debes iniciar sesión o registrarte (desde el menú de la página principal) para hacer un pedido.');
            return;
        }

        try {
            setIsCheckingOut(true);
            await api.post('/marketplace/orders', {
                branchId: branch.id,
                type: 'delivery',
                items: cart.items.map(i => ({
                    productVariantId: i.variantId,
                    quantity: i.quantity
                }))
            });
            cart.clearCart();
            setIsCartOpen(false);
            setOrderSuccess(true);
            setTimeout(() => setOrderSuccess(false), 5000);
        } catch (error: any) {
            setAlertMessage(error.response?.data?.message || 'Error al procesar el pedido.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const tokenString = localStorage.getItem('client-auth-storage');
        let tokenExists = false;
        if (tokenString) {
            try {
                const parsed = JSON.parse(tokenString);
                if (parsed?.state?.token) tokenExists = true;
            } catch (e) { }
        }

        if (!tokenExists) {
            setAlertMessage('Debes iniciar sesión o registrarte (desde el menú de la página principal) para dejar una reseña.');
            return;
        }

        try {
            setIsSubmittingReview(true);
            const res = await api.post(`/marketplace/branches/${id}/reviews`, {
                rating: newRating,
                comment: newComment
            });
            setReviews([{ ...res.data, isNew: true }, ...reviews]);
            setNewComment('');
            setNewRating(5);
        } catch (error: any) {
            setAlertMessage(error.response?.data?.message || 'Error al publicar la reseña.');
        } finally {
            setIsSubmittingReview(false);
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

    const filteredMenu = menu.map(category => ({
        ...category,
        products: category.products.filter((product: any) => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory ? category.id === activeCategory : true;
            return matchesSearch && matchesCategory;
        })
    })).filter(category => category.products.length > 0);

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
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                            <div className="flex items-center gap-3">
                                <Utensils className="text-primary" size={28} />
                                <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                    Menú Digital
                                </h2>
                            </div>

                            {menu.length > 0 && (
                                <div className="flex gap-4 w-full md:w-auto">
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar platos..."
                                            className={`w-full pl-10 pr-4 py-3 rounded-2xl font-bold transition-all border outline-none focus:ring-2 focus:ring-primary/40 ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-gray-50 border-gray-100 text-secondary placeholder-gray-400'}`}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {menu.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 mb-4">
                                <button
                                    onClick={() => setActiveCategory(null)}
                                    className={`px-6 py-2 rounded-xl text-sm font-black whitespace-nowrap transition-all ${activeCategory === null
                                        ? 'bg-primary text-white shadow-lg'
                                        : isDarkMode ? 'bg-white/5 text-white/50 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-secondary'
                                        }`}
                                >
                                    Todos
                                </button>
                                {menu.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`px-6 py-2 rounded-xl text-sm font-black whitespace-nowrap transition-all ${activeCategory === cat.id
                                            ? 'bg-primary text-white shadow-lg'
                                            : isDarkMode ? 'bg-white/5 text-white/50 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-secondary'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-3 mb-10">
                            <Utensils className="text-primary" size={28} />
                            <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                Menú Digital
                            </h2>
                        </div>

                        {filteredMenu.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[32px]">
                                <Utensils size={40} className="mx-auto mb-4 text-gray-300 dark:text-white/20" />
                                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{menu.length === 0 ? 'Aún no hay platos publicados' : 'No se encontraron resultados'}</h3>
                                <p className="text-text-secondary mt-2">{menu.length === 0 ? 'Vuelve pronto para descubrir sus delicias.' : 'Prueba buscando otra palabra.'}</p>
                            </div>
                        ) : (
                            <div className="space-y-16">
                                {filteredMenu.map((category) => (
                                    <div key={category.id}>
                                        <h3 className={`text-2xl font-black mb-8 pb-4 border-b uppercase tracking-widest ${isDarkMode ? 'text-white border-white/10' : 'text-secondary border-gray-100'}`}>
                                            {category.name}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {category.products.map((product: any) => {
                                                const defaultVariant = product.variants?.find((v: any) => v.isDefault) || product.variants?.[0];
                                                const price = defaultVariant ? defaultVariant.price : 0;

                                                return (
                                                    <div key={product.id} className={`group flex flex-col sm:flex-row gap-4 p-4 rounded-3xl border transition-all hover:shadow-xl relative overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-gray-100 hover:border-primary/10'}`}>
                                                        <div className="w-full sm:w-32 h-40 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                                                            {product.imageUrl ? (
                                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300"><Utensils size={32} /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col justify-between flex-1 py-1">
                                                            <div>
                                                                <h4 className={`font-black text-lg leading-tight mb-2 pr-12 ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                                                    {product.name}
                                                                </h4>
                                                                <p className={`text-xs line-clamp-2 md:line-clamp-3 mb-4 ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>
                                                                    {product.description || 'Delicioso plato preparado con los mejores ingredientes.'}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-end justify-between mt-auto">
                                                                <div className="font-black text-primary text-xl">
                                                                    Gs. {Number(price).toLocaleString()}
                                                                </div>
                                                                <button
                                                                    onClick={() => cart.addItem({
                                                                        id: `${product.id}-${defaultVariant?.id}`,
                                                                        productId: product.id,
                                                                        variantId: defaultVariant?.id,
                                                                        name: product.name,
                                                                        price: Number(price),
                                                                        quantity: 1,
                                                                        branchId: branch.id
                                                                    })}
                                                                    className={`w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg hover:scale-110 transition-transform`}
                                                                >
                                                                    <Plus size={20} />
                                                                </button>
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

                    {/* Reviews Section */}
                    <div className="pt-16 mt-16 border-t border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-3 mb-10">
                            <MessageSquare className="text-primary" size={28} />
                            <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                Reseñas
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Submit Review */}
                            <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                <h3 className={`text-xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Deja tu Opinión</h3>
                                <form onSubmit={handleReviewSubmit} className="space-y-6">
                                    <div>
                                        <label className={`block text-sm font-bold mb-3 ${isDarkMode ? 'text-white/80' : 'text-secondary'}`}>Calificación</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setNewRating(star)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        size={28}
                                                        className={star <= newRating ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-white/20"}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-bold mb-3 ${isDarkMode ? 'text-white/80' : 'text-secondary'}`}>Comentario</label>
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="¿Qué te pareció la comida?"
                                            rows={3}
                                            className={`w-full p-4 rounded-2xl resize-none font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all ${isDarkMode ? 'bg-black/20 text-white placeholder-white/30 border-white/5' : 'bg-white text-secondary placeholder-gray-400 border-gray-100'}`}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingReview}
                                        className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1 disabled:opacity-50"
                                    >
                                        {isSubmittingReview ? 'Publicando...' : 'Publicar Reseña'}
                                    </button>
                                </form>
                            </div>

                            {/* Review List */}
                            <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-3xl border-gray-200 dark:border-white/10">
                                        <Star className="mx-auto mb-3 text-gray-300 dark:text-white/20" size={32} />
                                        <p className="font-bold text-gray-500 dark:text-white/50">Sé el primero en dejar una reseña.</p>
                                    </div>
                                ) : (
                                    reviews.map((review, i) => (
                                        <div key={review.id || i} className={`p-6 rounded-3xl border ${review.isNew ? 'border-primary bg-primary/5' : isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} animate-in slide-in-from-bottom-5 fade-in duration-500`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className={`font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                                        {review.userName}
                                                    </h4>
                                                    <p className="text-xs font-bold text-text-secondary mt-1">
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 bg-amber-400/10 px-3 py-1 rounded-full">
                                                    <Star size={14} className="text-amber-400 fill-amber-400" />
                                                    <span className="text-sm font-black text-amber-500">{review.rating}.0</span>
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className={`text-sm italic font-medium ${isDarkMode ? 'text-white/70' : 'text-secondary/70'}`}>
                                                    "{review.comment}"
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cart Trigger FAB */}
                    {cart.items.length > 0 && cart.branchId === branch.id && (
                        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[60]">
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative flex items-center justify-center gap-3 bg-primary text-white h-16 px-8 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                            >
                                <ShoppingBag size={24} />
                                <div className="text-left hidden sm:block">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Tu Pedido</div>
                                    <div className="text-sm font-black">Gs. {cart.total.toLocaleString()}</div>
                                </div>
                                <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white flex items-center justify-center rounded-full text-xs font-black border-2 border-white dark:border-secondary shadow-lg">
                                    {cart.items.reduce((acc, curr) => acc + curr.quantity, 0)}
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Sidebar */}
            {isCartOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm animate-in fade-in" onClick={() => setIsCartOpen(false)} />
                    <div className={`relative w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ${isDarkMode ? 'bg-secondary border-l border-white/10' : 'bg-white'}`}>
                        {/* Cart Header */}
                        <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <ShoppingBag size={20} />
                                </div>
                                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Tu Carrito</h2>
                            </div>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                <X size={20} className={isDarkMode ? 'text-white' : 'text-secondary'} />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                            {cart.items.length === 0 ? (
                                <div className="text-center py-20 opacity-50">
                                    <ShoppingBag size={48} className="mx-auto mb-4" />
                                    <p className="font-bold">Tu carrito está vacío</p>
                                </div>
                            ) : (
                                cart.items.map(item => (
                                    <div key={item.id} className={`flex gap-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex-1">
                                            <h4 className={`font-black text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{item.name}</h4>
                                            <p className="text-primary font-bold text-xs mb-3">Gs. {item.price.toLocaleString()}</p>

                                            <div className="flex items-center gap-3 bg-white dark:bg-black/20 w-max rounded-lg p-1 border dark:border-white/10 shadow-sm">
                                                <button onClick={() => cart.updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-white/10">
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-4 text-center text-xs font-black">{item.quantity}</span>
                                                <button onClick={() => cart.updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded-md text-primary hover:bg-primary/10">
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                                Gs. {(item.price * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Checkout Footer */}
                        {cart.items.length > 0 && (
                            <div className={`p-6 border-t ${isDarkMode ? 'bg-surface border-white/10' : 'bg-white border-gray-100'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <span className={`text-sm font-bold opacity-60 ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Total a Pagar</span>
                                    <span className="text-2xl font-black text-primary">Gs. {cart.total.toLocaleString()}</span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isCheckingOut ? 'Procesando...' : <><MapPin size={18} /> Confirmar Pedido</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {orderSuccess && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top fade-in duration-500">
                    <div className="bg-emerald-500 text-white px-8 py-4 rounded-[24px] shadow-2xl flex items-center gap-4 border-4 border-emerald-400">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Utensils size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-lg">¡Pedido Enviado!</h4>
                            <p className="font-bold text-emerald-50 text-sm">Tu orden ya está en la cocina del restaurante.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Modal */}
            {alertMessage && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm animate-in fade-in" onClick={() => setAlertMessage(null)} />
                    <div className={`relative w-full max-w-sm p-8 rounded-[32px] shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300 border ${isDarkMode ? 'bg-surface border-white/10' : 'bg-white border-gray-100'}`}>
                        <div className="w-16 h-16 bg-amber-400/10 rounded-full flex items-center justify-center text-amber-500 mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className={`text-xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Aviso</h3>
                        <p className={`font-medium mb-8 ${isDarkMode ? 'text-white/70' : 'text-text-secondary'}`}>
                            {alertMessage}
                        </p>
                        <button
                            onClick={() => setAlertMessage(null)}
                            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


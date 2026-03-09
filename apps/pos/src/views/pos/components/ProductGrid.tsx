import { useCartStore } from '../../../stores/cart.store';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  variants: {
    id: string;
    name: string;
    price: number;
    isDefault: boolean;
  }[];
}

export function ProductGrid({ products }: { products: Product[] }) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddProduct = (product: Product, variant?: Product['variants'][0]) => {
    const v = variant || product.variants.find((v) => v.isDefault) || product.variants[0];
    if (!v) return;

    addItem({
      productVariantId: v.id,
      productName: product.name,
      variantName: v.name,
      quantity: 1,
      unitPrice: Number(v.price),
      modifiers: [],
    });
    toast.success(`${product.name} añadido`, {
      duration: 1500,
      position: 'bottom-center',
      style: {
        borderRadius: '16px',
        background: 'var(--color-secondary)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 'bold'
      }
    });
  };

  if (products.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-50 space-y-4">
        <div className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center border-4 border-dashed border-gray-100">
          <Plus size={30} />
        </div>
        <p className="font-bold tracking-tight">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
      {products.map((product) => (
        <div
          key={product.id}
          className="product-card group cursor-pointer flex flex-col h-full"
          onClick={() => handleAddProduct(product)}
        >
          <div className="product-image-container">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-text-secondary/30 italic font-medium">
                Sin Imagen
              </div>
            )}
            <div className="absolute top-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-primary shadow-lg active:scale-90">
                <Plus size={20} />
              </div>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-black text-text-main text-base group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-xs text-text-secondary mt-1 line-clamp-2 font-medium">
                  {product.description}
                </p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-end justify-between">
              {product.variants.length === 1 ? (
                <p className="text-primary font-black text-xl mb-[-4px]">
                  {formatCurrency(product.variants[0].price)}
                </p>
              ) : (
                <div className="flex flex-col w-full gap-2">
                  <p className="text-[10px] uppercase tracking-widest font-black text-text-secondary">Varios Precios</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.variants.slice(0, 3).map((v) => (
                      <button
                        key={v.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddProduct(product, v);
                        }}
                        className="text-[10px] px-2.5 py-1.5 rounded-xl bg-primary-light text-primary font-black hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        {formatCurrency(v.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

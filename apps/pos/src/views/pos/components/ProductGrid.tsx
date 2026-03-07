import { useCartStore } from '../../../stores/cart.store';
import toast from 'react-hot-toast';

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
    toast.success(`${product.name} agregado`, { duration: 1000 });
  };

  if (products.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No hay productos disponibles
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => handleAddProduct(product)}
          className="card text-left hover:shadow-md hover:border-blue-200 transition-all group"
        >
          {product.imageUrl && (
            <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600">
            {product.name}
          </h3>
          {product.variants.length === 1 ? (
            <p className="text-blue-600 font-bold text-lg mt-1">
              ${Number(product.variants[0].price).toLocaleString('es-AR')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddProduct(product, v);
                  }}
                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  {v.name} ${Number(v.price).toLocaleString('es-AR')}
                </button>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

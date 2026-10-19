import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Flame, Leaf, Eye, ShoppingBag, Sparkles, AlertCircle } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatINR } from '../../utils/pricing';
import { useCart } from '../../context/CartContext';

export const PizzaCard = ({ pizza, onSelect }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [imgSrc, setImgSrc] = useState(pizza.imageUrl || pizza.image);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const fallback = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80';

  const handleImageError = () => {
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!pizza.isAvailable) return;

    setIsAdding(true);
    await addToCart({
      itemType: 'catalog',
      pizzaId: pizza.id,
      quantity: 1,
    });
    setIsAdding(false);
  };

  return (
    <div
      className={`group bg-white rounded-3xl border overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full card-hover-lift ${
        pizza.isAvailable ? 'border-slate-200/90' : 'border-red-200 opacity-80'
      }`}
    >
      {/* Image container with fixed 4:3 aspect ratio */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={imgSrc}
          alt={pizza.name}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />

        {/* Floating tags */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {!pizza.isAvailable ? (
            <Badge variant="spicy" size="xs">
              Out of Stock
            </Badge>
          ) : (
            <>
              {pizza.isFeatured && (
                <Badge variant="spring" size="xs">
                  ★ Featured
                </Badge>
              )}
              {pizza.isVegetarian ? (
                <Badge variant="veg" size="xs">
                  <Leaf className="w-2.5 h-2.5 inline" /> Veg
                </Badge>
              ) : null}
              {pizza.isSpicy && (
                <Badge variant="spicy" size="xs">
                  <Flame className="w-2.5 h-2.5 inline" /> Spicy
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Category badge */}
        <div className="absolute bottom-3 right-3 bg-[#001F3F]/90 backdrop-blur-xs text-[#F6F7ED] px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
          <span>{pizza.category || 'Artisanal'}</span>
        </div>
      </div>

      {/* Body content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#001F3F] leading-snug group-hover:text-[#00804C] transition-colors">
            {pizza.name}
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-2 mb-4 font-normal">
            {pizza.description}
          </p>

          {/* Sourdough badge & ingredients snippet */}
          {pizza.ingredients?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {pizza.ingredients.slice(0, 3).map((ing, idx) => (
                <span
                  key={idx}
                  className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                >
                  {ing}
                </span>
              ))}
              {pizza.ingredients.length > 3 && (
                <span className="text-[10px] text-slate-400 font-semibold self-center">
                  +{pizza.ingredients.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Price and Order / Customize Actions */}
        <div className="pt-3 border-t border-slate-100 mt-auto space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Price
              </span>
              <span className="text-xl font-black text-[#001F3F] tracking-tight">
                {formatINR(pizza.basePricePaise)}
              </span>
            </div>

            <button
              onClick={() => onSelect && onSelect(pizza)}
              className="text-xs font-bold text-[#00804C] hover:text-[#74C365] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Details
            </button>
          </div>

          {/* Action Buttons: Add to Cart & Customize */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/builder`)}
              icon={Sparkles}
              disabled={!pizza.isAvailable}
              className="w-full text-xs"
            >
              Customize
            </Button>

            <Button
              size="sm"
              variant={pizza.isAvailable ? 'primary' : 'ghost'}
              onClick={handleAddToCart}
              loading={isAdding}
              disabled={!pizza.isAvailable}
              icon={ShoppingBag}
              className="w-full text-xs shadow-xs"
            >
              {pizza.isAvailable ? 'Add to Cart' : 'Unavailable'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PizzaCard;

import React, { useState } from 'react';
import { X, Leaf, Flame, ShieldCheck, Clock, Sparkles, ShoppingBag } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import { formatINR } from '../../utils/pricing';
import { useCart } from '../../context/CartContext';

export const PizzaDetailModal = ({ pizza, onClose }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  if (!pizza) return null;

  const handleAddToCart = async () => {
    if (!pizza.isAvailable) return;
    setIsAdding(true);
    await addToCart({
      itemType: 'catalog',
      pizzaId: pizza.id,
      quantity: 1,
    });
    setIsAdding(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white text-slate-700 hover:text-black p-2 rounded-full shadow-md transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero image */}
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100">
          <img
            src={pizza.imageUrl || pizza.image}
            alt={pizza.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6">
            <div>
              <div className="flex gap-2 mb-2">
                <Badge variant="spring" size="xs">
                  {pizza.category || 'Artisanal'}
                </Badge>
                {pizza.isVegetarian && (
                  <Badge variant="veg" size="xs">
                    <Leaf className="w-2.5 h-2.5 inline" /> Vegetarian
                  </Badge>
                )}
                {pizza.isSpicy && (
                  <Badge variant="spicy" size="xs">
                    <Flame className="w-2.5 h-2.5 inline" /> Spicy
                  </Badge>
                )}
                {!pizza.isAvailable && (
                  <Badge variant="spicy" size="xs">
                    Out of Stock
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {pizza.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {pizza.isAvailable ? 'Freshly Prepared' : 'Temporarily Unavailable'}
            </span>
            <div className="text-right">
              <span className="text-2xl font-black text-[#00804C]">
                {formatINR(pizza.basePricePaise)}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Recipe & Craft
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              {pizza.description}
            </p>
          </div>

          {pizza.ingredients?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Ingredients & Sourcing
              </h4>
              <div className="flex flex-wrap gap-2">
                {pizza.ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="bg-[#F6F7ED] text-[#001F3F] border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-[#00804C]" /> {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sourdough & Oven features */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#00804C] shrink-0" />
              <div>
                <span className="block text-xs font-bold text-[#001F3F]">48H Fermented Sourdough</span>
                <span className="text-[10px] text-slate-500">Airy cornicione & high digestibility</span>
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#00804C] shrink-0" />
              <div>
                <span className="block text-xs font-bold text-[#001F3F]">485°C Wood-Fired Bake</span>
                <span className="text-[10px] text-slate-500">Volcanic stone oak fire</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                onClose();
                navigate('/builder');
              }}
              icon={Sparkles}
              className="w-full sm:w-auto"
            >
              Customize in Builder
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleAddToCart}
              loading={isAdding}
              disabled={!pizza.isAvailable}
              icon={ShoppingBag}
              className="w-full sm:w-auto"
            >
              {pizza.isAvailable
                ? `Add to Cart (${formatINR(pizza.basePricePaise)})`
                : 'Currently Out of Stock'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PizzaDetailModal;

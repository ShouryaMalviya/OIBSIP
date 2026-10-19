import React from 'react';
import { X, Star, Leaf, Flame, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useNavigate } from 'react-router-dom';

export const PizzaDetailModal = ({ pizza, onClose }) => {
  const navigate = useNavigate();
  if (!pizza) return null;

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
            src={pizza.image}
            alt={pizza.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
            <div>
              <div className="flex gap-2 mb-2">
                <Badge variant="spring" size="xs">
                  {pizza.category} Edition
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#DBE64C] text-[#001F3F] font-bold px-2.5 py-1 rounded-full text-xs">
                <Star className="w-3.5 h-3.5 fill-[#001F3F]" />
                <span>{pizza.rating}</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">({pizza.reviewsCount} verified connoisseur reviews)</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#001F3F]">${pizza.price.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description & Craft</h4>
            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              {pizza.description}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Curated Ingredients</h4>
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

          {/* Value props */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#00804C] shrink-0" />
              <div>
                <span className="block text-[11px] font-bold text-[#001F3F]">48H Fermented Crust</span>
                <span className="text-[10px] text-slate-500">Light, airy & digestible</span>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#00804C] shrink-0" />
              <div>
                <span className="block text-[11px] font-bold text-[#001F3F]">Artisanal Wood-Fired</span>
                <span className="text-[10px] text-slate-500">Baked at 485°C</span>
              </div>
            </div>
          </div>

          {/* Footer action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                navigate('/register');
              }}
            >
              Sign Up To Order ($ {pizza.price.toFixed(2)})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PizzaDetailModal;

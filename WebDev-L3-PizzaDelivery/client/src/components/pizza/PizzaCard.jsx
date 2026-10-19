import React, { useState } from 'react';
import { Star, Flame, Leaf, ArrowRight, Eye } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export const PizzaCard = ({ pizza, onSelect }) => {
  const [imgSrc, setImgSrc] = useState(pizza.image);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    if (pizza.fallbackImage && imgSrc !== pizza.fallbackImage) {
      setImgSrc(pizza.fallbackImage);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full card-hover-lift">
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
          {pizza.isBestseller && (
            <Badge variant="spring" size="xs">
              ★ Signature
            </Badge>
          )}
          {pizza.isVegetarian ? (
            <Badge variant="veg" size="xs">
              <Leaf className="w-2.5 h-2.5 inline" /> Veg
            </Badge>
          ) : (
            <Badge variant="default" size="xs">
              Meat
            </Badge>
          )}
          {pizza.isSpicy && (
            <Badge variant="spicy" size="xs">
              <Flame className="w-2.5 h-2.5 inline" /> Spicy
            </Badge>
          )}
        </div>

        {/* Rating badge */}
        <div className="absolute bottom-3 right-3 bg-[#001F3F]/90 backdrop-blur-xs text-[#F6F7ED] px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
          <Star className="w-3 h-3 fill-[#DBE64C] text-[#DBE64C]" />
          <span>{pizza.rating}</span>
          <span className="text-slate-400 font-normal text-[10px]">({pizza.reviewsCount})</span>
        </div>
      </div>

      {/* Body content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#00804C] mb-1">
            {pizza.category} Edition
          </div>
          <h3 className="text-lg font-bold text-[#001F3F] leading-snug group-hover:text-[#00804C] transition-colors">
            {pizza.name}
          </h3>
          <p className="text-xs text-slate-500 font-medium italic mt-0.5 mb-2.5">
            "{pizza.tagline}"
          </p>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {pizza.description}
          </p>
        </div>

        {/* Footer info: price and quick view */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Price</span>
            <span className="text-xl font-extrabold text-[#001F3F] tracking-tight">
              ${pizza.price.toFixed(2)}
            </span>
          </div>

          <Button
            size="sm"
            variant="midnight"
            onClick={() => onSelect && onSelect(pizza)}
            icon={Eye}
            className="hover:scale-102"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PizzaCard;

import React, { useState, useMemo } from 'react';
import { Search, Filter, Sparkles, SlidersHorizontal, Leaf, Flame } from 'lucide-react';
import PizzaCard from '../components/pizza/PizzaCard';
import PizzaDetailModal from '../components/pizza/PizzaDetailModal';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { FEATURED_PIZZAS } from '../data/pizzas';
import { useNavigate } from 'react-router-dom';

export const Menu = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [vegOnly, setVegOnly] = useState(false);
  const [spicyOnly, setSpicyOnly] = useState(false);
  const [selectedPizza, setSelectedPizza] = useState(null);

  const categories = ['All', 'Classic', 'Artisanal', 'Signature'];

  const filteredPizzas = useMemo(() => {
    return FEATURED_PIZZAS.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      // Dietary filters
      if (vegOnly && !p.isVegetarian) return false;
      if (spicyOnly && !p.isSpicy) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesIngredient = p.ingredients.some((ing) => ing.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesIngredient) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // Default featured order
    });
  }, [selectedCategory, searchQuery, sortBy, vegOnly, spicyOnly]);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Header Banner */}
      <div className="bg-[#001F3F] text-[#F6F7ED] rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl border border-white/10">
        <div className="max-w-2xl relative z-10">
          <Badge variant="spring" size="sm" className="mb-3">
            Wood-Fired Catalog
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Artisanal Pizza Menu
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
            Every pizza begins with 48-hour cold-fermented live sourdough and is topped with DOP-certified Italian ingredients, baked at blistering 485°C.
          </p>
        </div>

        {/* Builder teaser banner */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#DBE64C] font-semibold">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Want to create your own bespoke pie? Interactive Crust & Topping Builder debuts in Part 2!</span>
          </div>
          <Button
            variant="accent"
            size="sm"
            onClick={() => navigate('/builder')}
            className="self-start sm:self-auto"
          >
            Preview Builder
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#001F3F] text-[#DBE64C] shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pizzas or ingredients..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00804C] focus:bg-white text-[#001F3F]"
            />
          </div>

        </div>

        {/* Secondary Filters: Dietary Toggles & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Dietary:
            </span>
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                vegOnly
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Leaf className="w-3 h-3" /> Vegetarian
            </button>
            <button
              onClick={() => setSpicyOnly(!spicyOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                spicyOnly
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Flame className="w-3 h-3" /> Spicy
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-[#001F3F] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00804C]"
            >
              <option value="featured">Featured Chef Selection</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Connoisseur Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pizza Grid */}
      {filteredPizzas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPizzas.map((pizza) => (
            <PizzaCard
              key={pizza.id}
              pizza={pizza}
              onSelect={(p) => setSelectedPizza(p)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-12 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F6F7ED] text-[#001F3F] flex items-center justify-center mx-auto text-2xl font-bold">
            🍕
          </div>
          <h3 className="text-xl font-bold text-[#001F3F]">No Pizzas Match Your Filter</h3>
          <p className="text-xs text-slate-500">
            We couldn't find any artisanal pizzas matching "{searchQuery}" with current dietary selections.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setVegOnly(false);
              setSpicyOnly(false);
            }}
          >
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPizza && (
        <PizzaDetailModal
          pizza={selectedPizza}
          onClose={() => setSelectedPizza(null)}
        />
      )}

    </div>
  );
};

export default Menu;

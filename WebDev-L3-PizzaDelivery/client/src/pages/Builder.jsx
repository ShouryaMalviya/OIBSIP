import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import pizzaService from '../services/pizza.service';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  Plus,
  Pizza,
  Layers,
  Flame,
  Info,
  RotateCcw,
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  calculateCustomPizzaUnitPrice,
  formatINR,
  PRICING_CONFIG,
} from '../utils/pricing';

export const Builder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCartItemId = searchParams.get('editCartItem');

  const { cart, addToCart, editCustomPizza } = useCart();

  const [ingredients, setIngredients] = useState({
    base: [],
    sauce: [],
    cheese: [],
    veggie: [],
  });
  const [loading, setLoading] = useState(true);

  // Current builder step: 1 = Base, 2 = Sauce, 3 = Cheese, 4 = Veggies, 5 = Review
  const [currentStep, setCurrentStep] = useState(1);

  // Selected state
  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedSauce, setSelectedSauce] = useState(null);
  const [selectedCheese, setSelectedCheese] = useState(null);
  const [selectedVeggies, setSelectedVeggies] = useState([]);
  const [customName, setCustomName] = useState('My Custom Sourdough Creation');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load ingredients from backend API
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoading(true);
        const res = await pizzaService.getIngredients();
        if (res?.data?.grouped) {
          setIngredients(res.data.grouped);

          // If editing an item from cart
          if (editCartItemId && cart?.items) {
            const itemToEdit = cart.items.find((i) => i.id === editCartItemId && i.itemType === 'custom');
            if (itemToEdit && itemToEdit.customPizza) {
              const cp = itemToEdit.customPizza;
              setCustomName(cp.name || 'My Custom Sourdough Creation');
              setQuantity(itemToEdit.quantity || 1);

              const foundBase = res.data.grouped.base.find((b) => b.id === (cp.base?.id || cp.baseId));
              if (foundBase) setSelectedBase(foundBase);

              const foundSauce = res.data.grouped.sauce.find((s) => s.id === (cp.sauce?.id || cp.sauceId));
              if (foundSauce) setSelectedSauce(foundSauce);

              const foundCheese = res.data.grouped.cheese.find((c) => c.id === (cp.cheese?.id || cp.cheeseId));
              if (foundCheese) setSelectedCheese(foundCheese);

              if (cp.veggies || cp.veggieIds) {
                const targetIds = (cp.veggies || []).map((v) => v.id).concat(cp.veggieIds || []);
                const foundVeggies = res.data.grouped.veggie.filter((v) => targetIds.includes(v.id));
                setSelectedVeggies(foundVeggies);
              }
              return;
            }
          }

          // Default initial selection
          if (!selectedBase && res.data.grouped.base.length > 0) {
            setSelectedBase(res.data.grouped.base[0]);
          }
          if (!selectedSauce && res.data.grouped.sauce.length > 0) {
            setSelectedSauce(res.data.grouped.sauce[0]);
          }
          if (!selectedCheese && res.data.grouped.cheese.length > 0) {
            setSelectedCheese(res.data.grouped.cheese[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load ingredients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, [editCartItemId, cart]);

  // Authoritative live price calculation in integer paise
  const liveUnitPricePaise = useMemo(() => {
    return calculateCustomPizzaUnitPrice({
      baseAdjustmentPaise: selectedBase?.priceAdjustmentPaise || 0,
      sauceAdjustmentPaise: selectedSauce?.priceAdjustmentPaise || 0,
      cheeseAdjustmentPaise: selectedCheese?.priceAdjustmentPaise || 0,
      veggieAdjustmentsPaise: selectedVeggies.map((v) => v.priceAdjustmentPaise),
    });
  }, [selectedBase, selectedSauce, selectedCheese, selectedVeggies]);

  const liveTotalPricePaise = liveUnitPricePaise * quantity;

  // Toggle veggie selection (multiple allowed)
  const toggleVeggie = (veggie) => {
    if (!veggie.isAvailable) return;
    if (selectedVeggies.some((v) => v.id === veggie.id)) {
      setSelectedVeggies(selectedVeggies.filter((v) => v.id !== veggie.id));
    } else {
      setSelectedVeggies([...selectedVeggies, veggie]);
    }
  };

  // Validation before proceeding
  const canProceed = () => {
    if (currentStep === 1) return !!selectedBase;
    if (currentStep === 2) return !!selectedSauce;
    if (currentStep === 3) return !!selectedCheese;
    return true;
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit custom pizza to cart
  const handleAddToCart = async () => {
    if (!selectedBase || !selectedSauce || !selectedCheese) {
      return;
    }

    setIsSubmitting(true);
    const customPayload = {
      name: customName.trim() || 'Custom Artisanal Pizza',
      baseId: selectedBase.id,
      sauceId: selectedSauce.id,
      cheeseId: selectedCheese.id,
      veggieIds: selectedVeggies.map((v) => v.id),
    };

    if (editCartItemId) {
      // Update existing item
      await editCustomPizza(editCartItemId, customPayload);
      setIsSubmitting(false);
      navigate('/cart');
    } else {
      // Add new item
      await addToCart({
        itemType: 'custom',
        quantity,
        customPizza: customPayload,
      });
      setIsSubmitting(false);
    }
  };

  // Steps configuration
  const steps = [
    { number: 1, label: 'Crust Base', desc: 'Choose your sourdough dough' },
    { number: 2, label: 'Sauce Canvas', desc: 'Layer your rich sauce base' },
    { number: 3, label: 'Cheese Blend', desc: 'Select authentic mozzarella' },
    { number: 4, label: 'Farm Veggies', desc: 'Add fresh market toppings' },
    { number: 5, label: 'Chef Review', desc: 'Finalize your masterpiece' },
  ];

  // Colors for visual canvas sauce
  const getSauceColor = () => {
    if (!selectedSauce) return '#C83228';
    if (selectedSauce.name.includes('Alfredo')) return '#FAF0E6';
    if (selectedSauce.name.includes('Pesto')) return '#4B8B3B';
    if (selectedSauce.name.includes('Barbecue')) return '#652A0E';
    if (selectedSauce.name.includes('Spicy')) return '#A51D1D';
    return '#D03B29';
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#00804C] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#001F3F]">Loading Artisanal Ingredients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-[#001F3F] text-[#F6F7ED] rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Badge variant="spring" size="sm">
            {editCartItemId ? 'Editing Cart Item' : 'Four-Step Interactive Builder'}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
            Custom Pizza Crafting Table
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Choose your cold-fermented sourdough crust, artisan sauce, gourmet cheese, and fresh garden vegetables with live pricing.
          </p>
        </div>

        {/* Live Floating Price Widget */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 text-right min-w-[200px]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#DBE64C] block">
            Estimated Unit Price
          </span>
          <div className="text-3xl font-black text-white">
            {formatINR(liveUnitPricePaise)}
          </div>
          <span className="text-[10px] text-slate-300">
            Base ₹199 + selected adjustments
          </span>
        </div>
      </div>

      {/* Step Progress Indicator */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
          {steps.map((st) => {
            const isCompleted = currentStep > st.number;
            const isCurrent = currentStep === st.number;

            return (
              <button
                key={st.number}
                onClick={() => {
                  // Allow jumping back to earlier steps or review if valid
                  if (st.number <= currentStep || (st.number === 5 && canProceed())) {
                    setCurrentStep(st.number);
                  }
                }}
                disabled={st.number > currentStep && !canProceed()}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#001F3F] text-[#DBE64C] shadow-sm ring-2 ring-[#001F3F]'
                    : isCompleted
                    ? 'bg-[#F6F7ED] text-[#00804C] hover:bg-slate-100'
                    : 'bg-slate-50 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">
                    Step {st.number}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#00804C]" />}
                </div>
                <div className="text-xs sm:text-sm font-bold truncate">
                  {st.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Builder Area: 2 Columns (Ingredient Selector on Left, Visual Preview Canvas on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Ingredient Selection Steps */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          
          {/* STEP 1: CHOOSE A BASE */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Badge variant="mantis" size="xs">
                  Step 1 of 4
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-[#001F3F] mt-1">
                  Choose Your Pizza Base
                </h2>
                <p className="text-xs text-slate-500">
                  Select one crust crafted with organic unbleached flour and 48h cold fermentation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {ingredients.base.map((b) => {
                  const isSelected = selectedBase?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => b.isAvailable && setSelectedBase(b)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        !b.isAvailable
                          ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                          : isSelected
                          ? 'border-[#001F3F] bg-[#F6F7ED] shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-sm font-bold text-[#001F3F]">{b.name}</h4>
                          <span className={`text-xs font-black ${b.priceAdjustmentPaise === 0 ? 'text-[#00804C]' : 'text-slate-700'}`}>
                            {b.priceAdjustmentPaise === 0 ? 'Included' : `+${formatINR(b.priceAdjustmentPaise)}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">
                          {b.description}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {b.isAvailable ? 'In Kitchen' : 'Out of Stock'}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 font-bold text-[#00804C]">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE A SAUCE */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Badge variant="mantis" size="xs">
                  Step 2 of 4
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-[#001F3F] mt-1">
                  Choose Your Sauce Canvas
                </h2>
                <p className="text-xs text-slate-500">
                  Select your sauce base simmered in small batches with Italian extra virgin olive oil.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {ingredients.sauce.map((s) => {
                  const isSelected = selectedSauce?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => s.isAvailable && setSelectedSauce(s)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        !s.isAvailable
                          ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                          : isSelected
                          ? 'border-[#001F3F] bg-[#F6F7ED] shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-sm font-bold text-[#001F3F]">{s.name}</h4>
                          <span className={`text-xs font-black ${s.priceAdjustmentPaise === 0 ? 'text-[#00804C]' : 'text-slate-700'}`}>
                            {s.priceAdjustmentPaise === 0 ? 'Included' : `+${formatINR(s.priceAdjustmentPaise)}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">
                          {s.description}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {s.isAvailable ? 'In Kitchen' : 'Out of Stock'}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 font-bold text-[#00804C]">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CHOOSE CHEESE */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Badge variant="mantis" size="xs">
                  Step 3 of 4
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-[#001F3F] mt-1">
                  Choose Cheese Layer
                </h2>
                <p className="text-xs text-slate-500">
                  Select your primary artisanal cheese foundation (single selection).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {ingredients.cheese.map((c) => {
                  const isSelected = selectedCheese?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => c.isAvailable && setSelectedCheese(c)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        !c.isAvailable
                          ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                          : isSelected
                          ? 'border-[#001F3F] bg-[#F6F7ED] shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-sm font-bold text-[#001F3F]">{c.name}</h4>
                          <span className={`text-xs font-black ${c.priceAdjustmentPaise === 0 ? 'text-[#00804C]' : 'text-slate-700'}`}>
                            {c.priceAdjustmentPaise === 0 ? 'Included' : `+${formatINR(c.priceAdjustmentPaise)}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">
                          {c.description}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {c.isAvailable ? 'In Kitchen' : 'Out of Stock'}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 font-bold text-[#00804C]">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: CHOOSE VEGETABLES */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="mantis" size="xs">
                    Step 4 of 4
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-black text-[#001F3F] mt-1">
                    Select Farm Fresh Vegetables
                  </h2>
                  <p className="text-xs text-slate-500">
                    Choose as many organic vegetable toppings as you like (multiple allowed).
                  </p>
                </div>
                <span className="text-xs font-bold text-[#00804C] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {selectedVeggies.length} Selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {ingredients.veggie.map((v) => {
                  const isSelected = selectedVeggies.some((sv) => sv.id === v.id);
                  return (
                    <div
                      key={v.id}
                      onClick={() => toggleVeggie(v)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        !v.isAvailable
                          ? 'opacity-40 cursor-not-allowed bg-slate-50'
                          : isSelected
                          ? 'border-[#00804C] bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-[#001F3F] truncate">{v.name}</h4>
                          <span className="text-[11px] font-bold text-slate-600">
                            +{formatINR(v.priceAdjustmentPaise)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                          {v.description}
                        </p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {v.isAvailable ? 'Available' : 'Out of Stock'}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-[#00804C] border-[#00804C] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: CHEF REVIEW */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <Badge variant="spring" size="xs">
                  Review & Finalize
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-[#001F3F] mt-1">
                  Review Your Custom Pizza
                </h2>
                <p className="text-xs text-slate-500">
                  Verify your bespoke ingredient combinations before sending your order to the wood-fired kitchen.
                </p>
              </div>

              {/* Pizza Custom Name Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#001F3F] mb-1.5">
                  Name Your Pizza Creation
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Elena's Midnight Special"
                  className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00804C]"
                />
              </div>

              {/* Selections Breakdown Table */}
              <div className="bg-[#F6F7ED] p-5 rounded-2xl border border-slate-200/90 space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-[#001F3F] block">Dough & Crust</span>
                    <span className="text-xs text-slate-500">{selectedBase?.name}</span>
                  </div>
                  <span className="font-bold text-slate-700">
                    {selectedBase?.priceAdjustmentPaise === 0 ? 'Included' : `+${formatINR(selectedBase?.priceAdjustmentPaise)}`}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-[#001F3F] block">Sauce Canvas</span>
                    <span className="text-xs text-slate-500">{selectedSauce?.name}</span>
                  </div>
                  <span className="font-bold text-slate-700">
                    {selectedSauce?.priceAdjustmentPaise === 0 ? 'Included' : `+${formatINR(selectedSauce?.priceAdjustmentPaise)}`}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-[#001F3F] block">Cheese Layer</span>
                    <span className="text-xs text-slate-500">{selectedCheese?.name}</span>
                  </div>
                  <span className="font-bold text-slate-700">
                    {selectedCheese?.priceAdjustmentPaise === 0 ? 'Included' : `+${formatINR(selectedCheese?.priceAdjustmentPaise)}`}
                  </span>
                </div>

                <div className="flex justify-between items-start pb-2 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-[#001F3F] block">Garden Vegetables ({selectedVeggies.length})</span>
                    <span className="text-xs text-slate-500">
                      {selectedVeggies.length > 0
                        ? selectedVeggies.map((v) => v.name).join(', ')
                        : 'No additional vegetables selected'}
                    </span>
                  </div>
                  <span className="font-bold text-slate-700">
                    +{formatINR(selectedVeggies.reduce((sum, v) => sum + v.priceAdjustmentPaise, 0))}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 text-base font-black text-[#001F3F]">
                  <span>Calculated Unit Price:</span>
                  <span className="text-[#00804C]">{formatINR(liveUnitPricePaise)}</span>
                </div>
              </div>

              {/* Quantity Picker */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Quantity
                </span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-2xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-[#001F3F]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(20, quantity + 1))}
                    className="p-2 hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                size="md"
                onClick={prevStep}
                icon={ArrowLeft}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <Button
                variant="primary"
                size="md"
                onClick={nextStep}
                disabled={!canProceed()}
                icon={ArrowRight}
                iconPosition="right"
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                loading={isSubmitting}
                icon={Sparkles}
                className="shadow-md"
              >
                {editCartItemId ? 'Save Changes' : `Add to Cart (${formatINR(liveTotalPricePaise)})`}
              </Button>
            )}
          </div>

        </div>

        {/* Right Column: Interactive Live Visual Pizza Canvas & Summary Card */}
        <div className="lg:col-span-5 space-y-6 sticky top-28">
          
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-6 text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Wood-Fired Preview Canvas
            </h3>

            {/* Interactive Pizza Visual Illustration */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto flex items-center justify-center">
              
              {/* Outer Golden Crust Ring */}
              <div
                className="w-full h-full rounded-full flex items-center justify-center p-3 shadow-2xl transition-all duration-500"
                style={{
                  background:
                    selectedBase?.name?.includes('Whole Wheat')
                      ? '#8B5A2B'
                      : selectedBase?.name?.includes('Pan Crust')
                      ? '#C68642'
                      : selectedBase?.name?.includes('Cheese Burst')
                      ? '#E5A65E'
                      : '#DE9B52',
                  boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.2), 0 10px 25px rgba(0,0,0,0.15)',
                }}
              >
                {/* Sauce Layer */}
                <div
                  className="w-full h-full rounded-full flex items-center justify-center p-2 transition-all duration-500"
                  style={{
                    backgroundColor: getSauceColor(),
                  }}
                >
                  {/* Cheese Melt Layer */}
                  <div
                    className="w-full h-full rounded-full relative overflow-hidden flex items-center justify-center transition-all duration-500"
                    style={{
                      background:
                        selectedCheese?.name?.includes('Cheddar')
                          ? '#FFAE42'
                          : selectedCheese?.name?.includes('Parmesan')
                          ? '#FFF8DC'
                          : selectedCheese?.name?.includes('Vegan')
                          ? '#FFFDD0'
                          : '#FFF3CD',
                    }}
                  >
                    {/* Golden toasted cheese spots */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#8B4513_2px,transparent_2px)] [background-size:16px_16px]" />

                    {/* Vegetable Toppings overlay tags */}
                    <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 p-4 max-w-[200px]">
                      {selectedVeggies.map((v, i) => (
                        <span
                          key={v.id}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75 duration-200"
                          style={{
                            backgroundColor:
                              i % 4 === 0
                                ? '#00804C' // Book green
                                : i % 4 === 1
                                ? '#D9534F' // Tomato red
                                : i % 4 === 2
                                ? '#001F3F' // Midnight
                                : '#1E488F', // Nuit blanche
                          }}
                        >
                          {v.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Pill Breakdown */}
            <div className="text-left space-y-2 text-xs bg-[#F6F7ED] p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Base:</span>
                <span className="font-bold text-[#001F3F]">{selectedBase?.name || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sauce:</span>
                <span className="font-bold text-[#001F3F]">{selectedSauce?.name || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cheese:</span>
                <span className="font-bold text-[#001F3F]">{selectedCheese?.name || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Veggies ({selectedVeggies.length}):</span>
                <span className="font-bold text-[#001F3F]">
                  +{formatINR(selectedVeggies.reduce((sum, v) => sum + v.priceAdjustmentPaise, 0))}
                </span>
              </div>
            </div>

            {/* Total Price & Direct Add Action */}
            <div className="pt-2">
              <Button
                variant="accent"
                size="lg"
                className="w-full shadow-md"
                onClick={handleAddToCart}
                loading={isSubmitting}
                icon={Sparkles}
              >
                {editCartItemId ? 'Update Custom Pizza' : `Add Custom Pizza • ${formatINR(liveTotalPricePaise)}`}
              </Button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Builder;

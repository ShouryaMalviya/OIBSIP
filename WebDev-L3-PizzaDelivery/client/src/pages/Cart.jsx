import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Edit2,
  Pizza,
  ArrowLeft,
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export const Cart = () => {
  const {
    items,
    itemsCount,
    pricing,
    hasUnavailableItems,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Badge variant="bookGreen" size="sm" className="mb-2">
            Order Review
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight font-display">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your artisanal pizza selections before advancing to delivery and payment.
          </p>
        </div>

        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            icon={Trash2}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 self-start sm:self-auto"
          >
            Empty Cart
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 sm:p-16 border border-slate-200 text-center max-w-lg mx-auto space-y-6">
          <div className="w-24 h-24 rounded-full bg-[#F6F7ED] flex items-center justify-center text-4xl mx-auto">
            🍕
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#001F3F]">Your Cart is Currently Empty</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              You haven't added any pizzas to your order yet. Explore our Neapolitan signatures or craft your own custom pie.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link to="/menu">
              <Button variant="primary" size="md" icon={Pizza} className="w-full sm:w-auto">
                Explore Menu
              </Button>
            </Link>
            <Link to="/builder">
              <Button variant="accent" size="md" icon={Sparkles} className="w-full sm:w-auto">
                Build Custom Pizza
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Two-Column Grid: Items on Left, Order Summary on Right */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Items List (Left Column) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Free Delivery Bar */}
            {pricing && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#001F3F]">
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#00804C]" />
                    {pricing.isFreeDelivery ? (
                      <span className="text-[#00804C]">🎉 Your order qualifies for FREE Flash Delivery!</span>
                    ) : (
                      <span>Add {pricing.formatted.amountToFreeDelivery} more to enjoy FREE delivery</span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400">Threshold: ₹500</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#00804C] h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.min(100, (pricing.subtotalPaise / 50000) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Out-of-stock warning banner */}
            {hasUnavailableItems && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Items Unavailable</h4>
                  <p className="mt-0.5">
                    Certain items in your cart are currently out of stock. They have been omitted from the total price calculation.
                  </p>
                </div>
              </div>
            )}

            {/* Items Cards */}
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-2xs ${
                    item.isAvailable
                      ? 'border-slate-200/90'
                      : 'border-red-200 bg-red-50/20 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                    
                    {/* Item Thumbnail & Info */}
                    <div className="flex gap-4 items-start sm:items-center min-w-0 flex-1">
                      {item.itemType === 'catalog' ? (
                        <img
                          src={item.pizza?.imageUrl}
                          alt={item.pizza?.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#001F3F] text-[#DBE64C] flex items-center justify-center shrink-0 shadow-xs">
                          <Pizza className="w-10 h-10" />
                        </div>
                      )}

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-[#001F3F]">
                            {item.itemType === 'catalog'
                              ? item.pizza?.name
                              : item.customPizza?.name || 'Custom Pizza'}
                          </h3>
                          {item.itemType === 'custom' && (
                            <Badge variant="spring" size="xs">
                              Custom Crafted
                            </Badge>
                          )}
                          {!item.isAvailable && (
                            <Badge variant="spicy" size="xs">
                              Out of Stock
                            </Badge>
                          )}
                        </div>

                        {item.itemType === 'catalog' ? (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {item.pizza?.description}
                          </p>
                        ) : (
                          <div className="text-xs text-slate-600 space-y-0.5 pt-0.5">
                            <p>
                              <strong>Base:</strong> {item.customPizza?.base?.name} ·{' '}
                              <strong>Sauce:</strong> {item.customPizza?.sauce?.name} ·{' '}
                              <strong>Cheese:</strong> {item.customPizza?.cheese?.name}
                            </p>
                            {item.customPizza?.veggies?.length > 0 && (
                              <p className="text-slate-500">
                                <strong>Veggies:</strong>{' '}
                                {item.customPizza.veggies.map((v) => v.name).join(', ')}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="pt-1 text-xs text-slate-500">
                          Unit Price: <span className="font-semibold text-slate-700">{item.unitPriceFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                      
                      {item.itemType === 'custom' && (
                        <button
                          onClick={() => navigate(`/builder?editCartItem=${item.id}`)}
                          className="text-xs font-semibold text-[#00804C] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}

                      <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-[#001F3F]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= 20}
                          className="p-2 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-lg font-black text-[#001F3F]">
                          {item.totalPriceFormatted}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping Buttons */}
            <div className="pt-4 flex flex-wrap gap-4">
              <Link to="/menu">
                <Button variant="outline" size="md" icon={ArrowLeft}>
                  Continue Browsing Menu
                </Button>
              </Link>
              <Link to="/builder">
                <Button variant="accent" size="md" icon={Sparkles}>
                  Build Another Custom Pizza
                </Button>
              </Link>
            </div>

          </div>

          {/* Order Summary Card (Right Column) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-6 sticky top-28">
            <h3 className="text-base font-extrabold uppercase tracking-wider text-[#001F3F] border-b border-slate-100 pb-3">
              Order Summary
            </h3>

            {pricing && (
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal ({itemsCount} items)</span>
                  <span className="font-bold text-[#001F3F]">{pricing.formatted.subtotal}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span>Delivery Fee</span>
                    <span className="block text-[11px] text-slate-400">Heated thermal pods</span>
                  </div>
                  <span className={pricing.isFreeDelivery ? 'font-bold text-[#00804C]' : 'font-semibold text-[#001F3F]'}>
                    {pricing.formatted.deliveryFee}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span>Goods & Services Tax</span>
                    <span className="block text-[11px] text-slate-400">5% Food Service GST</span>
                  </div>
                  <span className="font-semibold text-[#001F3F]">{pricing.formatted.tax}</span>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-extrabold text-[#001F3F]">Grand Total</span>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Inclusive of all taxes</span>
                  </div>
                  <span className="text-2xl font-black text-[#00804C]">
                    {pricing.formatted.grandTotal}
                  </span>
                </div>
              </div>
            )}

            {/* Checkout Action Button */}
            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full shadow-lg"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => {
                  alert('Part 2 Complete! In Part 3, this proceeds to live Order Creation, Inventory Reservation & Razorpay Checkout.');
                }}
              >
                Proceed to Checkout
              </Button>
              <p className="text-[11px] text-center text-slate-400">
                Part 3 Payment Integration & Order Summary contract ready
              </p>
            </div>

            {/* Quality Guarantee Notes */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00804C]" />
                <span>100% Sourdough & DOP Ingredient Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#00804C]" />
                <span>Flash-delivered at peak 75°C temperature</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Cart;

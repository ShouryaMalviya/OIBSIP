import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Truck,
  AlertTriangle,
  Edit2,
  Pizza,
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export const CartDrawer = () => {
  const {
    items,
    itemsCount,
    pricing,
    hasUnavailableItems,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 bg-[#001F3F] text-[#F6F7ED] flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00804C] flex items-center justify-center text-[#DBE64C]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight">Your Pizza Order</h2>
                <span className="text-xs text-slate-300">
                  {itemsCount} {itemsCount === 1 ? 'item' : 'items'} in cart
                </span>
              </div>
            </div>

            <button
              onClick={closeDrawer}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Incentive Progress Bar */}
          {items.length > 0 && pricing && (
            <div className="bg-[#F6F7ED] px-6 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between text-xs font-semibold text-[#001F3F] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#00804C]" />
                  {pricing.isFreeDelivery ? (
                    <span className="text-[#00804C] font-bold">🎉 You unlocked FREE Delivery!</span>
                  ) : (
                    <span>Add {pricing.formatted.amountToFreeDelivery} more for FREE delivery</span>
                  )}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#00804C] h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, (pricing.subtotalPaise / 50000) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Stale / Unavailable Warning */}
          {hasUnavailableItems && (
            <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Some items in your cart are currently out of stock and excluded from checkout.</span>
            </div>
          )}

          {/* Items Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#F6F7ED] flex items-center justify-center text-3xl">
                  🍕
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#001F3F]">Your cart is hungry!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Explore our wood-fired signatures or construct your custom artisanal sourdough pie.
                  </p>
                </div>
                <div className="pt-2 flex flex-col w-full gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      closeDrawer();
                      navigate('/menu');
                    }}
                  >
                    Browse Artisanal Menu
                  </Button>
                  <Button
                    variant="accent"
                    size="md"
                    icon={Sparkles}
                    onClick={() => {
                      closeDrawer();
                      navigate('/builder');
                    }}
                  >
                    Build Custom Pizza
                  </Button>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.isAvailable
                      ? 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                      : 'bg-red-50/50 border-red-200 opacity-75'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Item Image or Custom Pizza Icon */}
                    {item.itemType === 'catalog' ? (
                      <img
                        src={item.pizza?.imageUrl}
                        alt={item.pizza?.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#001F3F] text-[#DBE64C] flex items-center justify-center shrink-0">
                        <Pizza className="w-8 h-8" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#001F3F] truncate">
                          {item.itemType === 'catalog'
                            ? item.pizza?.name
                            : item.customPizza?.name || 'Custom Pizza'}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Custom Pizza Ingredients breakdown */}
                      {item.itemType === 'custom' && (
                        <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                          <p>
                            <span className="font-semibold text-slate-700">Crust:</span>{' '}
                            {item.customPizza?.base?.name}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">Sauce & Cheese:</span>{' '}
                            {item.customPizza?.sauce?.name}, {item.customPizza?.cheese?.name}
                          </p>
                          {item.customPizza?.veggies?.length > 0 && (
                            <p className="truncate">
                              <span className="font-semibold text-slate-700">Veggies:</span>{' '}
                              {item.customPizza.veggies.map((v) => v.name).join(', ')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Out of Stock Notice */}
                      {!item.isAvailable && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-red-600 uppercase bg-red-100 px-2 py-0.5 rounded-md">
                          Unavailable
                        </span>
                      )}

                      {/* Price and Quantity controls */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
                        <span className="text-sm font-extrabold text-[#001F3F]">
                          {item.totalPriceFormatted}
                        </span>

                        <div className="flex items-center gap-2">
                          {item.itemType === 'custom' && (
                            <button
                              onClick={() => {
                                closeDrawer();
                                navigate(`/builder?editCartItem=${item.id}`);
                              }}
                              className="text-[11px] font-semibold text-[#00804C] hover:underline flex items-center gap-1 mr-1"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                          )}

                          <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden shadow-2xs">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-[#001F3F]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= 20}
                              className="p-1 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Pricing Summary */}
          {items.length > 0 && pricing && (
            <div className="p-6 bg-white border-t border-slate-200 space-y-4">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#001F3F]">{pricing.formatted.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className={pricing.isFreeDelivery ? 'font-bold text-[#00804C]' : 'font-semibold'}>
                    {pricing.formatted.deliveryFee}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (5% GST)</span>
                  <span className="font-semibold text-[#001F3F]">{pricing.formatted.tax}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-[#001F3F] pt-2 border-t border-slate-100">
                  <span>Grand Total</span>
                  <span className="text-[#00804C]">{pricing.formatted.grandTotal}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    closeDrawer();
                    navigate('/cart');
                  }}
                >
                  View Full Cart
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => {
                    closeDrawer();
                    navigate('/cart');
                  }}
                >
                  Checkout
                </Button>
              </div>

              <button
                onClick={clearCart}
                className="w-full text-center text-xs text-slate-400 hover:text-red-600 transition-colors"
              >
                Clear all items from cart
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;

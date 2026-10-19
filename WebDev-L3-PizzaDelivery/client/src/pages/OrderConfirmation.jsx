import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../services/order.service';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SkeletonLoader from '../components/common/SkeletonLoader';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Pizza,
  Receipt,
  ArrowRight,
  ShieldCheck,
  ChefHat,
  Bike,
  Home as HomeIcon,
} from 'lucide-react';
import { formatINR } from '../utils/pricing';

export const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await orderService.getOrderById(orderId);
        if (isMounted) {
          setOrder(response.data?.order || response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.userMessage || 'Could not load order details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
        <SkeletonLoader variant="card" count={2} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-3xl">
          ⚠️
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#001F3F]">Order Not Found</h2>
          <p className="text-sm text-slate-500">{error || 'Unable to retrieve order confirmation.'}</p>
        </div>
        <Link to="/orders">
          <Button variant="primary" size="md">View My Orders</Button>
        </Link>
      </div>
    );
  }

  const steps = [
    { title: 'Order Received', icon: CheckCircle2, active: true, done: true },
    { title: 'In Kitchen Oven', icon: ChefHat, active: order.orderStatus === 'in_kitchen' || order.orderStatus === 'received', done: false },
    { title: 'Out for Delivery', icon: Bike, active: order.orderStatus === 'sent_to_delivery', done: false },
    { title: 'Delivered', icon: HomeIcon, active: order.orderStatus === 'delivered', done: false },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in">
      
      {/* Success Hero Header */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 text-center space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#74C365] via-[#DBE64C] to-[#00804C]"></div>
        
        <div className="w-20 h-20 rounded-full bg-[#F6F7ED] border-4 border-[#74C365]/30 flex items-center justify-center mx-auto text-[#00804C]">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <Badge variant="bookGreen" size="sm">Payment Verified • Razorpay Test Mode</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight font-display">
            Grazie! Your Order is Confirmed
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto">
            Our Neapolitan pizzaiolos have received your ticket. Your dough is being tossed and wood-fired to perfection.
          </p>
        </div>

        {/* Order Identifier Card */}
        <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-[#F6F7ED] px-6 py-3 rounded-2xl border border-slate-200">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">Order Number</span>
            <span className="font-mono font-extrabold text-[#001F3F] text-base">{order.orderNumber}</span>
          </div>
          <div className="h-8 w-px bg-slate-300 hidden sm:block"></div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">Status</span>
            <span className="text-xs font-bold text-[#00804C] capitalize">{order.orderStatus.replace('_', ' ')}</span>
          </div>
          <div className="h-8 w-px bg-slate-300 hidden sm:block"></div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">Estimated Arrival</span>
            <span className="text-xs font-bold text-[#001F3F]">~35 Minutes</span>
          </div>
        </div>

      </div>

      {/* Live Baking Tracker Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00804C]" />
            <h2 className="text-lg font-black text-[#001F3F]">Live Preparation Status</h2>
          </div>
          <Badge variant="accent" size="sm">Stage 1 of 4</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                  st.done
                    ? 'border-[#00804C] bg-emerald-50/60 text-[#00804C]'
                    : st.active
                    ? 'border-[#DBE64C] bg-[#F6F7ED] text-[#001F3F]'
                    : 'border-slate-100 bg-slate-50/50 text-slate-400'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-extrabold block">{st.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Grid: Items Snapshot & Delivery Address */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Purchased Items Snapshot */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Pizza className="w-5 h-5 text-[#00804C]" />
              <h2 className="text-lg font-black text-[#001F3F]">Purchased Snapshot</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">Immutable Record</span>
          </div>

          <div className="divide-y divide-slate-100 space-y-4">
            {order.items.map((it) => (
              <div key={it.id || it._id} className="pt-4 first:pt-0 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-[#001F3F]">
                    {it.quantity} × {it.name}
                  </h4>
                  
                  {/* Custom Pizza breakdown if applicable */}
                  {it.itemType === 'custom' && it.customPizza && (
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p><span className="font-semibold text-slate-700">Crust:</span> {it.customPizza.base?.name}</p>
                      <p><span className="font-semibold text-slate-700">Sauce & Cheese:</span> {it.customPizza.sauce?.name}, {it.customPizza.cheese?.name}</p>
                      {it.customPizza.veggies?.length > 0 && (
                        <p><span className="font-semibold text-slate-700">Veggies:</span> {it.customPizza.veggies.map((v) => v.name).join(', ')}</p>
                      )}
                    </div>
                  )}

                  <span className="text-xs text-slate-400">
                    {formatINR(it.unitPricePaise)} each
                  </span>
                </div>

                <span className="text-sm font-bold text-[#001F3F] shrink-0">
                  {formatINR(it.totalPricePaise)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[#001F3F]">{formatINR(order.subtotalPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-semibold text-[#001F3F]">
                {order.deliveryFeePaise === 0 ? 'FREE' : formatINR(order.deliveryFeePaise)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxes (5% Food GST)</span>
              <span className="font-semibold text-[#001F3F]">{formatINR(order.taxPaise)}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-black text-[#001F3F]">Grand Total Paid</span>
              <span className="text-xl font-black text-[#00804C]">
                {formatINR(order.grandTotalPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Destination & Payment Receipt Info */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Destination */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-[#00804C]" />
              <h3 className="text-base font-black text-[#001F3F]">Delivery Destination</h3>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-[#001F3F] text-sm">{order.deliveryAddress?.fullName}</p>
              <p className="text-slate-500">{order.deliveryAddress?.phone}</p>
              <p>{order.deliveryAddress?.street}</p>
              <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.postalCode}</p>
              {order.deliveryAddress?.instructions && (
                <p className="pt-2 text-slate-400 italic">"{order.deliveryAddress.instructions}"</p>
              )}
            </div>
          </div>

          {/* Payment Snapshot */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Receipt className="w-5 h-5 text-[#00804C]" />
              <h3 className="text-base font-black text-[#001F3F]">Payment Receipt</h3>
            </div>
            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Payment Gateway:</span>
                <span className="font-semibold text-[#001F3F]">Razorpay (Test Mode)</span>
              </div>
              <div className="flex justify-between">
                <span>Payment ID:</span>
                <span className="font-mono text-[11px] text-slate-500 truncate max-w-[150px]">
                  {order.razorpayPaymentId || 'pay_verified_test'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <Badge variant="bookGreen" size="sm">PAID</Badge>
              </div>
              <div className="flex justify-between">
                <span>Order Placed:</span>
                <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="space-y-3 pt-2">
            <Link to="/orders">
              <Button variant="primary" size="lg" className="w-full justify-center" icon={Receipt}>
                View Order History
              </Button>
            </Link>
            <Link to="/menu">
              <Button variant="outline" size="md" className="w-full justify-center" icon={Pizza}>
                Order More Pizzas
              </Button>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default OrderConfirmation;

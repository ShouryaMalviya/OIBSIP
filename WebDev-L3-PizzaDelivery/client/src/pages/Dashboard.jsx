import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import orderService from '../services/order.service';
import socketService from '../services/socket.service';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SkeletonLoader from '../components/common/SkeletonLoader';
import toast from 'react-hot-toast';
import {
  Pizza,
  Receipt,
  Clock,
  MapPin,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ChefHat,
  Bike,
  Home,
  Sparkles,
  Wifi,
  WifiOff,
  Radio,
  ShoppingBag,
  RotateCcw,
  PlusCircle,
  AlertCircle,
  Calendar,
  XCircle,
} from 'lucide-react';
import { formatINR } from '../utils/pricing';

const STAGES = [
  { key: 'received', title: 'Order Received', desc: 'Ticket confirmed & sent to pizzeria', icon: Receipt },
  { key: 'in_kitchen', title: 'In Kitchen Oven', desc: 'Hand-tossed dough in wood-fired oven', icon: ChefHat },
  { key: 'sent_to_delivery', title: 'Sent to Delivery', desc: 'Hot artisanal pizza on courier route', icon: Bike },
  { key: 'delivered', title: 'Delivered', desc: 'Arrived hot & crispy at your door', icon: Home },
];

export const Dashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { addToCart, openDrawer } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [cancellingId, setCancellingId] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);
  const [lastLivePing, setLastLivePing] = useState(null);

  // Fetch customer orders
  const fetchOrders = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const res = await orderService.getMyOrders();
      const list = res.data?.orders || [];
      setOrders(list);
    } catch (err) {
      if (!isSilent) setError(err.userMessage || 'Failed to retrieve your orders.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, fetchOrders]);

  // Monitor socket connection state
  useEffect(() => {
    const unsub = socketService.onConnectionChange((status) => {
      setConnectionStatus(status);
    });
    return unsub;
  }, []);

  // Most active order for tracking (or most recent)
  const activeOrder = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    // Prefer non-delivered and non-cancelled orders
    const active = orders.find(
      (o) => o.orderStatus === 'received' || o.orderStatus === 'in_kitchen' || o.orderStatus === 'sent_to_delivery'
    );
    // If none active, show the most recent order
    return active || orders[0];
  }, [orders]);

  // Subscribe to real-time updates for the active order
  useEffect(() => {
    if (!activeOrder?.id) return;

    const unsub = socketService.subscribeToOrder(activeOrder.id, {
      onStatusUpdated: (updatedData) => {
        console.log('[Dashboard] Received live update for order:', updatedData);
        setLastLivePing(new Date());

        // Update local state smoothly without full reload
        setOrders((prev) =>
          prev.map((ord) => {
            if (ord.id === updatedData.orderId || ord.orderNumber === updatedData.orderNumber) {
              const updatedStatus = updatedData.orderStatus || ord.orderStatus;
              return {
                ...ord,
                orderStatus: updatedStatus,
                paymentStatus: updatedData.paymentStatus || ord.paymentStatus,
                updatedAt: updatedData.updatedAt || new Date(),
                statusHistory: updatedData.statusHistory || ord.statusHistory,
              };
            }
            return ord;
          })
        );

        // Update selected modal order if open
        setSelectedOrder((prev) => {
          if (prev && (prev.id === updatedData.orderId || prev.orderNumber === updatedData.orderNumber)) {
            return {
              ...prev,
              orderStatus: updatedData.orderStatus || prev.orderStatus,
              paymentStatus: updatedData.paymentStatus || prev.paymentStatus,
              updatedAt: updatedData.updatedAt || new Date(),
              statusHistory: updatedData.statusHistory || prev.statusHistory,
            };
          }
          return prev;
        });

        toast.success(`Order #${updatedData.orderNumber || ''} is now: ${updatedData.orderStatus.replace(/_/g, ' ').toUpperCase()}! 🍕`, {
          icon: '🔔',
          duration: 4000,
        });
      },
      onSubscribed: (ack) => {
        console.log('[Dashboard] Subscribed to real-time tracking:', ack);
      },
      onError: (err) => {
        console.warn('[Dashboard] Socket subscription error:', err?.message);
      },
    });

    return () => {
      unsub();
    };
  }, [activeOrder?.id]);

  // Handle reorder
  const handleReorder = async (orderToReorder) => {
    if (!orderToReorder || !orderToReorder.items?.length) return;
    try {
      setReorderingId(orderToReorder.id);
      let addedCount = 0;

      for (const item of orderToReorder.items) {
        if (item.itemType === 'catalog' && item.pizzaId) {
          await addToCart({
            itemType: 'catalog',
            pizzaId: item.pizzaId,
            quantity: item.quantity || 1,
          });
          addedCount++;
        } else if (item.itemType === 'custom' && item.customPizza) {
          const cp = item.customPizza;
          await addToCart({
            itemType: 'custom',
            customPizza: {
              name: cp.name || 'Custom Artisanal Pizza',
              baseId: cp.base?.id,
              sauceId: cp.sauce?.id,
              cheeseId: cp.cheese?.id,
              veggieIds: (cp.veggies || []).map((v) => v.id),
            },
            quantity: item.quantity || 1,
          });
          addedCount++;
        }
      }

      toast.success(`Added ${addedCount} item(s) from order #${orderToReorder.orderNumber} to your cart!`);
      openDrawer();
    } catch (err) {
      toast.error('Could not complete reorder. Some items may be out of stock.');
    } finally {
      setReorderingId(null);
    }
  };

  // Handle cancellation
  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm('Are you sure you wish to cancel this order? Committed stock will be restored.');
    if (!confirmCancel) return;

    try {
      setCancellingId(orderId);
      await orderService.cancelOrder(orderId, 'Cancelled by customer via dashboard');
      toast.success('Order cancelled and inventory released.');
      await fetchOrders(true);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      toast.error(err.userMessage || 'Could not cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  // Compute stage status for active order timeline
  const getStageState = (stageKey, currentStatus) => {
    if (currentStatus === 'cancelled') {
      return 'cancelled';
    }
    const orderProgression = ['received', 'in_kitchen', 'sent_to_delivery', 'delivered'];
    const currentIdx = orderProgression.indexOf(currentStatus);
    const targetIdx = orderProgression.indexOf(stageKey);

    if (currentStatus === 'awaiting_payment') {
      return targetIdx === 0 ? 'active' : 'pending';
    }

    if (currentIdx === -1) return 'pending';
    if (targetIdx < currentIdx) return 'completed';
    if (targetIdx === currentIdx) return 'active';
    return 'pending';
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#F6F7ED] flex items-center justify-center mx-auto text-3xl">
          🔒
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#001F3F]">Sign in to Access Dashboard</h2>
          <p className="text-sm text-slate-500">
            Please log in to your PizzaVerse account to track live orders and manage your pizza preferences.
          </p>
        </div>
        <Link to="/login?redirect=/dashboard">
          <Button variant="primary" size="md">Sign In</Button>
        </Link>
      </div>
    );
  }

  const completedCount = orders.filter((o) => o.orderStatus === 'delivered').length;
  const inProgressCount = orders.filter((o) => ['received', 'in_kitchen', 'sent_to_delivery'].includes(o.orderStatus)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* 1. WELCOME SECTION */}
      <div className="relative bg-gradient-to-br from-[#001F3F] to-[#0a2f5c] rounded-3xl p-6 sm:p-10 text-white shadow-xl overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-[#DBE64C]/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-20 -mb-12 w-48 h-48 rounded-full bg-[#74C365]/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="spring" size="sm">Artisan Pizza Club</Badge>
              {user?.isEmailVerified && (
                <span className="text-[11px] font-bold text-[#74C365] bg-[#74C365]/20 px-2.5 py-0.5 rounded-full border border-[#74C365]/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display text-[#F6F7ED]">
              Benvenuto, {user?.name || 'Artisan Explorer'}! 🍕
            </h1>
            <p className="text-xs sm:text-sm text-[#F6F7ED]/80 max-w-xl">
              Track your wood-fired pies in real time, reorder your favorite crust combinations, and craft custom recipes with artisanal toppings.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/15 text-center">
              <span className="text-2xl sm:text-3xl font-black text-[#DBE64C]">{inProgressCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/70 block font-bold">Active Oven</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/15 text-center">
              <span className="text-2xl sm:text-3xl font-black text-[#74C365]">{completedCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/70 block font-bold">Pies Delivered</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/15 text-center">
              <span className="text-2xl sm:text-3xl font-black text-white">{orders.length}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/70 block font-bold">Total Orders</span>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-3">
          <Link to="/builder">
            <Button variant="accent" size="sm" icon={PlusCircle}>
              Customize Another Pizza
            </Button>
          </Link>
          <Link to="/menu">
            <Button variant="outline" size="sm" icon={Pizza} className="bg-white/10 text-white hover:bg-white/20 border-white/20">
              Browse Menu
            </Button>
          </Link>
          <Link to="/cart">
            <Button variant="outline" size="sm" icon={ShoppingBag} className="bg-white/10 text-white hover:bg-white/20 border-white/20">
              View Cart
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchOrders(false)}
            loading={loading}
            className="text-white/80 hover:text-white ml-auto"
          >
            Refresh Feed
          </Button>
        </div>
      </div>

      {/* 2. REAL-TIME CONNECTION STATUS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          {connectionStatus === 'connected' ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#74C365] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00804C]"></span>
              </span>
              <span className="font-extrabold text-[#00804C] flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-[#00804C]" /> Real-Time Socket.IO Active
              </span>
            </>
          ) : (
            <>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              <span className="font-extrabold text-amber-700 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-amber-600 animate-pulse" /> Controlled Polling Fallback Active (5s Interval)
              </span>
            </>
          )}
        </div>

        <div className="text-slate-400 text-[11px] flex items-center gap-3">
          {lastLivePing && (
            <span>Last live event: {lastLivePing.toLocaleTimeString()}</span>
          )}
          <span>REST API Authoritative</span>
        </div>
      </div>

      {/* 3. ACTIVE ORDER REAL-TIME TRACKING TIMELINE */}
      {activeOrder && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="bookGreen" size="sm">Live Order Tracking</Badge>
                {activeOrder.orderStatus === 'cancelled' ? (
                  <Badge variant="neutral" size="sm" className="bg-red-50 text-red-700 border border-red-200">
                    Cancelled
                  </Badge>
                ) : (
                  <span className="text-xs font-bold text-[#00804C] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Est. Arrival ~{activeOrder.estimatedDeliveryMinutes || 35} mins
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-[#001F3F] mt-1 flex items-center gap-2">
                Order #{activeOrder.orderNumber}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ExternalLink}
                onClick={() => setSelectedOrder(activeOrder)}
              >
                Receipt
              </Button>
              {(activeOrder.orderStatus === 'received' || activeOrder.orderStatus === 'awaiting_payment') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleCancelOrder(activeOrder.id)}
                  loading={cancellingId === activeOrder.id}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </div>

          {/* Cancellation Notice Banner if Cancelled */}
          {activeOrder.orderStatus === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-red-700">
                <XCircle className="w-4 h-4 text-red-600" />
                This order was cancelled ({activeOrder.cancellationReason || 'Cancelled'}).
              </div>
              <p className="text-red-600">
                Any reserved ingredient portions have been fully restored to the kitchen inventory.
              </p>
            </div>
          )}

          {/* Multi-Stage Visual Timeline */}
          {activeOrder.orderStatus !== 'cancelled' && (
            <div className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STAGES.map((stage, idx) => {
                  const state = getStageState(stage.key, activeOrder.orderStatus);
                  const Icon = stage.icon;

                  let cardClasses = 'bg-[#F6F7ED] border-slate-200 text-slate-500';
                  let iconBg = 'bg-slate-200 text-slate-500';
                  let statusBadge = <span className="text-[10px] font-bold text-slate-400">PENDING</span>;

                  if (state === 'completed') {
                    // Established Book Green (#00804C) & Mantis (#74C365) for completed stages
                    cardClasses = 'bg-[#74C365]/10 border-[#74C365] text-[#001F3F] shadow-xs';
                    iconBg = 'bg-[#00804C] text-[#F6F7ED]';
                    statusBadge = (
                      <span className="text-[10px] font-black text-[#00804C] bg-[#74C365]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#00804C]" /> COMPLETED
                      </span>
                    );
                  } else if (state === 'active') {
                    // Established Spring (#DBE64C) for the active stage with pulsing effect
                    cardClasses = 'bg-[#DBE64C]/25 border-[#DBE64C] text-[#001F3F] ring-2 ring-[#DBE64C] shadow-md';
                    iconBg = 'bg-[#001F3F] text-[#DBE64C] shadow-xs animate-pulse';
                    statusBadge = (
                      <span className="text-[10px] font-black text-[#001F3F] bg-[#DBE64C] px-2 py-0.5 rounded-full">
                        IN PROGRESS
                      </span>
                    );
                  }

                  return (
                    <div
                      key={stage.key}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${cardClasses}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {statusBadge}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Stage {idx + 1}
                        </span>
                        <h4 className="text-sm font-black text-[#001F3F]">{stage.title}</h4>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Order Item Snapshot */}
          <div className="bg-[#F6F7ED] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-[#001F3F] block">Pies in this order:</span>
              <p className="text-slate-600 font-medium">
                {activeOrder.items?.map((it) => `${it.quantity}× ${it.name}`).join(' • ')}
              </p>
              <p className="text-slate-400 text-[11px]">
                Delivering to: {activeOrder.deliveryAddress?.city}, {activeOrder.deliveryAddress?.postalCode}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Grand Total</span>
                <span className="text-lg font-black text-[#00804C]">{formatINR(activeOrder.grandTotalPaise)}</span>
              </div>
              <Button
                variant="accent"
                size="sm"
                icon={RotateCcw}
                onClick={() => handleReorder(activeOrder)}
                loading={reorderingId === activeOrder.id}
              >
                Reorder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ORDERS HISTORY TABLE / CARDS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-black text-[#001F3F] tracking-tight font-display">
              Order History & Reordering
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review receipts, inspect ingredients, and safely reorder past culinary creations.
            </p>
          </div>
        </div>

        {loading && orders.length === 0 && (
          <div className="space-y-4">
            <SkeletonLoader variant="card" count={3} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto">
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchOrders(false)}>
              Retry Loading
            </Button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto space-y-5 border border-slate-200 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-[#F6F7ED] flex items-center justify-center mx-auto text-3xl">
              🍕
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#001F3F]">No Previous Orders</h3>
              <p className="text-xs text-slate-500">
                You haven't ordered any pizzas yet. Build your first custom pie today!
              </p>
            </div>
            <Link to="/builder">
              <Button variant="accent" size="sm" icon={PlusCircle}>Build Custom Pizza</Button>
            </Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((ord) => {
              const formattedDate = new Date(ord.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-extrabold text-[#001F3F] text-sm">
                        {ord.orderNumber}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5" /> {formattedDate}
                      </span>
                      <Badge variant={ord.orderStatus === 'delivered' ? 'mantis' : ord.orderStatus === 'cancelled' ? 'neutral' : 'spring'} size="xs">
                        {ord.orderStatus.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-[10px] font-bold text-[#00804C] bg-emerald-50 px-2 py-0.5 rounded">
                        {ord.paymentStatus.toUpperCase()}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-700 pt-0.5">
                      {ord.items?.map((it) => `${it.quantity}× ${it.name}`).join(' • ')}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Destination: {ord.deliveryAddress?.city}, {ord.deliveryAddress?.postalCode}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                      <span className="text-base font-black text-[#00804C]">
                        {formatINR(ord.grandTotalPaise)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={ExternalLink}
                        onClick={() => setSelectedOrder(ord)}
                      >
                        Details
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        icon={RotateCcw}
                        onClick={() => handleReorder(ord)}
                        loading={reorderingId === ord.id}
                      >
                        Reorder
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Official Order Receipt</span>
                <h3 className="text-xl font-black text-[#001F3F]">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Status & Gateway metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#F6F7ED] p-4 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Fulfillment Status</span>
                <span className="font-extrabold text-[#001F3F] capitalize">{selectedOrder.orderStatus.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Status</span>
                <span className="font-extrabold text-[#00804C] uppercase">{selectedOrder.paymentStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Razorpay Payment Ref</span>
                <span className="font-mono text-[10px] text-slate-600 truncate block">
                  {selectedOrder.razorpayPaymentId || 'pay_test_ref'}
                </span>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itemized Breakdown</h4>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-start text-xs">
                    <div>
                      <p className="font-extrabold text-[#001F3F]">{it.quantity} × {it.name}</p>
                      {it.itemType === 'custom' && it.customPizza && (
                        <p className="text-[11px] text-slate-400 pt-0.5">
                          {it.customPizza.base?.name} • {it.customPizza.sauce?.name} • {it.customPizza.cheese?.name}
                          {it.customPizza.veggies?.length > 0 && ` • ${it.customPizza.veggies.map((v) => v.name).join(', ')}`}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-[#001F3F]">{formatINR(it.totalPricePaise)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatINR(selectedOrder.subtotalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges:</span>
                <span>{selectedOrder.deliveryFeePaise === 0 ? 'FREE' : formatINR(selectedOrder.deliveryFeePaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (5% GST):</span>
                <span>{formatINR(selectedOrder.taxPaise)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-[#001F3F] pt-2 border-t border-slate-100">
                <span>Grand Total:</span>
                <span className="text-[#00804C]">{formatINR(selectedOrder.grandTotalPaise)}</span>
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-[#001F3F] block">Delivery Destination:</span>
              <p>{selectedOrder.deliveryAddress?.fullName} ({selectedOrder.deliveryAddress?.phone})</p>
              <p>
                {selectedOrder.deliveryAddress?.street}, {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} - {selectedOrder.deliveryAddress?.postalCode}
              </p>
              {selectedOrder.deliveryAddress?.instructions && (
                <p className="text-slate-400 text-[11px] italic">Note: "{selectedOrder.deliveryAddress.instructions}"</p>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="accent"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  handleReorder(selectedOrder);
                  setSelectedOrder(null);
                }}
              >
                Reorder These Items
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedOrder(null)}>
                Close Receipt
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

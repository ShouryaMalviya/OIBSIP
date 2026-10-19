import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/order.service';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SkeletonLoader from '../components/common/SkeletonLoader';
import toast from 'react-hot-toast';
import {
  Receipt,
  Clock,
  MapPin,
  ChevronRight,
  Pizza,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { formatINR } from '../utils/pricing';

export const Orders = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getMyOrders();
      setOrders(response.data?.orders || []);
    } catch (err) {
      setError(err.userMessage || 'Failed to fetch order history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm('Are you sure you wish to cancel this order? Stock will be restored.');
    if (!confirmCancel) return;

    try {
      setCancellingId(orderId);
      await orderService.cancelOrder(orderId, 'Cancelled by customer via order history');
      toast.success('Order cancelled successfully.');
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      toast.error(err.userMessage || 'Could not cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'received':
        return <Badge variant="bookGreen" size="sm">Received</Badge>;
      case 'in_kitchen':
        return <Badge variant="mantis" size="sm">In Kitchen</Badge>;
      case 'sent_to_delivery':
        return <Badge variant="primary" size="sm">Out for Delivery</Badge>;
      case 'delivered':
        return <Badge variant="bookGreen" size="sm">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="neutral" size="sm" className="bg-red-50 text-red-600 border border-red-200">Cancelled</Badge>;
      case 'awaiting_payment':
      default:
        return <Badge variant="warning" size="sm">Awaiting Payment</Badge>;
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="text-[11px] font-bold text-[#00804C] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">PAID</span>;
      case 'refunded':
        return <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">REFUNDED</span>;
      case 'failed':
        return <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">FAILED</span>;
      case 'pending':
      default:
        return <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">PENDING</span>;
    }
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#F6F7ED] flex items-center justify-center mx-auto text-3xl">
          🔒
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#001F3F]">Sign in to View Orders</h2>
          <p className="text-sm text-slate-500">
            Please log in to your PizzaVerse account to inspect your order history.
          </p>
        </div>
        <Link to="/login?redirect=/orders">
          <Button variant="primary" size="md">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Badge variant="bookGreen" size="sm" className="mb-2">Customer Dashboard</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight font-display">
            My Order History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review past artisanal pizza orders, receipts, and live fulfillment tickets.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchOrders}
          loading={loading}
          className="self-start sm:self-auto"
        >
          Refresh Orders
        </Button>
      </div>

      {/* Loading Skeleton */}
      {loading && orders.length === 0 && (
        <div className="space-y-4">
          <SkeletonLoader variant="card" count={3} />
        </div>
      )}

      {/* Error / Retry State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            Retry Loading
          </Button>
        </div>
      )}

      {/* Empty Orders State */}
      {!loading && !error && orders.length === 0 && (
        <div className="bg-white rounded-3xl p-12 sm:p-16 border border-slate-200 text-center max-w-lg mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#F6F7ED] flex items-center justify-center mx-auto text-3xl">
            🍕
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#001F3F]">No Orders Yet</h2>
            <p className="text-sm text-slate-500">
              You haven't placed any artisanal pizza orders yet. Explore our Neapolitan recipes or craft a custom pie!
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Link to="/menu">
              <Button variant="primary" size="md">Explore Menu</Button>
            </Link>
            <Link to="/builder">
              <Button variant="accent" size="md">Build Pizza</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Orders List */}
      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((ord) => {
            const formattedDate = new Date(ord.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const canCancel = ord.orderStatus === 'awaiting_payment' || ord.orderStatus === 'received';

            return (
              <div
                key={ord.id || ord._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header Row: Order Number & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-[#001F3F] text-base">
                      {ord.orderNumber}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getPaymentStatusBadge(ord.paymentStatus)}
                    {getOrderStatusBadge(ord.orderStatus)}
                  </div>
                </div>

                {/* Body Row: Purchased items summary & pricing */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-slate-800">
                      {ord.items.map((it) => `${it.quantity}× ${it.name}`).join(' • ')}
                    </div>
                    <div className="text-slate-400">
                      Delivery to: {ord.deliveryAddress?.city}, {ord.deliveryAddress?.postalCode}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-bold">Total</span>
                      <span className="text-xl font-black text-[#00804C]">
                        {formatINR(ord.grandTotalPaise)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(ord)}
                        icon={ExternalLink}
                      >
                        Details
                      </Button>

                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleCancelOrder(ord.id || ord._id)}
                          loading={cancellingId === (ord.id || ord._id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Selected Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Order Details</span>
                <h3 className="text-xl font-black text-[#001F3F]">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Status & Payment snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#F6F7ED] p-4 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Status</span>
                <span className="font-extrabold text-[#001F3F] capitalize">{selectedOrder.orderStatus.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Status</span>
                <span className="font-extrabold text-[#00804C] uppercase">{selectedOrder.paymentStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Gateway Ref</span>
                <span className="font-mono text-[10px] text-slate-600 truncate block">
                  {selectedOrder.razorpayPaymentId || 'pay_test_ref'}
                </span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchased Items Snapshot</h4>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-start text-xs">
                    <div>
                      <p className="font-extrabold text-[#001F3F]">{it.quantity} × {it.name}</p>
                      {it.itemType === 'custom' && it.customPizza && (
                        <p className="text-[11px] text-slate-400 pt-0.5">
                          {it.customPizza.base?.name} • {it.customPizza.sauce?.name} • {it.customPizza.cheese?.name}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-[#001F3F]">{formatINR(it.totalPricePaise)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials Breakdown */}
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

            {/* Destination */}
            <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-[#001F3F] block">Delivery Address:</span>
              <p>{selectedOrder.deliveryAddress?.fullName} ({selectedOrder.deliveryAddress?.phone})</p>
              <p>{selectedOrder.deliveryAddress?.street}, {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} - {selectedOrder.deliveryAddress?.postalCode}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
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

export default Orders;

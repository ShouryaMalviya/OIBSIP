import React, { useEffect, useState, useCallback } from 'react';
import adminService from '../../services/admin.service';
import socketService from '../../services/socket.service';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import toast from 'react-hot-toast';
import {
  ShoppingBag,
  Search,
  Filter,
  ChefHat,
  Bike,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  MapPin,
  Pizza,
  Receipt,
  AlertCircle,
  Wifi,
} from 'lucide-react';
import { formatINR } from '../../utils/pricing';

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getAdminOrders({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      setOrders(res.data?.orders || []);
    } catch (err) {
      toast.error('Failed to retrieve admin orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to real-time administrative order updates
  useEffect(() => {
    const unsub = socketService.subscribeToAdmin({
      onOrderUpdated: (data) => {
        console.log('[AdminOrders] Live order update event:', data);
        setOrders((prev) =>
          prev.map((ord) => {
            if (ord.id === data.orderId || ord.orderNumber === data.orderNumber) {
              return {
                ...ord,
                orderStatus: data.orderStatus,
                paymentStatus: data.paymentStatus,
                updatedAt: data.updatedAt,
                statusHistory: data.statusHistory || ord.statusHistory,
              };
            }
            return ord;
          })
        );

        setSelectedOrder((prev) => {
          if (prev && (prev.id === data.orderId || prev.orderNumber === data.orderNumber)) {
            return {
              ...prev,
              orderStatus: data.orderStatus,
              paymentStatus: data.paymentStatus,
              updatedAt: data.updatedAt,
              statusHistory: data.statusHistory || prev.statusHistory,
            };
          }
          return prev;
        });
      },
      onNewOrder: (data) => {
        console.log('[AdminOrders] Live new order event:', data);
        toast.success(`🍕 New paid order received: #${data.orderNumber} (${formatINR(data.grandTotalPaise)})`, {
          duration: 5000,
          icon: '🔔',
        });
        if (data.order) {
          setOrders((prev) => [data.order, ...prev.filter((o) => o.id !== data.order.id)]);
        } else {
          fetchOrders();
        }
      },
    });

    return unsub;
  }, [fetchOrders]);

  const handleStatusTransition = async (orderId, targetStatus, reason = '') => {
    try {
      setUpdatingId(orderId);
      await adminService.updateOrderStatus(orderId, {
        status: targetStatus,
        reason: reason || `Advanced to ${targetStatus} by kitchen manager`,
      });
      toast.success(`Order status updated to "${targetStatus}".`);
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const refreshed = await adminService.getAdminOrder(orderId);
        setSelectedOrder(refreshed.data.order);
      }
    } catch (err) {
      toast.error(err.userMessage || 'Status transition rejected.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'received':
        return <Badge variant="bookGreen" size="sm">Received</Badge>;
      case 'in_kitchen':
        return <Badge variant="spring" size="sm">In Kitchen (Oven)</Badge>;
      case 'sent_to_delivery':
        return <Badge variant="primary" size="sm">Out for Delivery</Badge>;
      case 'delivered':
        return <Badge variant="mantis" size="sm">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="neutral" size="sm" className="bg-red-50 text-red-700 border border-red-200">Cancelled</Badge>;
      case 'awaiting_payment':
      default:
        return <Badge variant="warning" size="sm">Awaiting Payment</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Badge variant="bookGreen" size="sm" className="mb-2">Kitchen & Logistics Management</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight font-display">
            Order Fulfillment Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Progress customer tickets through wood-fired baking, courier dispatch, and fulfillment delivery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#74C365]/20 text-[#00804C] border border-[#74C365]/40 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#74C365] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00804C]"></span>
            </span>
            Real-Time Sync Live
          </span>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchOrders}
            loading={loading}
          >
            Refresh Orders
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'received', label: 'Received (New)' },
            { id: 'in_kitchen', label: 'In Kitchen' },
            { id: 'sent_to_delivery', label: 'Out for Delivery' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#001F3F] text-[#DBE64C] shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative pt-1 border-t border-slate-100">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order number (PV-...), customer name, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00804C]"
          />
        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {loading && orders.length === 0 ? (
          <div className="p-8 space-y-4">
            <SkeletonLoader variant="card" count={3} />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
            <p>No orders match the selected status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-6">Order Number</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status & Payment</th>
                  <th className="py-3.5 px-6 text-right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const isUpdating = updatingId === ord.id;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="font-mono font-bold text-[#001F3F] text-sm hover:text-[#00804C] hover:underline"
                        >
                          {ord.orderNumber}
                        </button>
                        <span className="block text-[10px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString([], {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800">{ord.deliveryAddress?.fullName}</p>
                        <p className="text-[11px] text-slate-400">{ord.deliveryAddress?.phone}</p>
                      </td>

                      <td className="py-4 px-4 max-w-xs truncate">
                        <span className="font-semibold text-slate-700">
                          {ord.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-black text-sm text-[#00804C]">
                        {formatINR(ord.grandTotalPaise)}
                      </td>

                      <td className="py-4 px-4 space-y-1">
                        <div>{getOrderStatusBadge(ord.orderStatus)}</div>
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          ord.paymentStatus === 'paid' ? 'bg-emerald-50 text-[#00804C]' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {ord.paymentStatus.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        {ord.orderStatus === 'received' && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={ChefHat}
                            loading={isUpdating}
                            onClick={() => handleStatusTransition(ord.id, 'in_kitchen', 'Ticket sent to oven')}
                          >
                            Send to Oven
                          </Button>
                        )}

                        {ord.orderStatus === 'in_kitchen' && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Bike}
                            loading={isUpdating}
                            onClick={() => handleStatusTransition(ord.id, 'sent_to_delivery', 'Handed over to dispatch courier')}
                          >
                            Dispatch Delivery
                          </Button>
                        )}

                        {ord.orderStatus === 'sent_to_delivery' && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={CheckCircle2}
                            loading={isUpdating}
                            onClick={() => handleStatusTransition(ord.id, 'delivered', 'Delivery confirmed at doorstep')}
                          >
                            Mark Delivered
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={ExternalLink}
                          onClick={() => setSelectedOrder(ord)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Ticket Details</span>
                <h3 className="text-xl font-black text-[#001F3F]">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            {/* Status Pipeline Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F6F7ED] p-4 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Order Status</span>
                <span className="font-extrabold text-[#001F3F] capitalize">{selectedOrder.orderStatus.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Payment Status</span>
                <span className="font-extrabold text-[#00804C] uppercase">{selectedOrder.paymentStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Inventory Status</span>
                <span className="font-semibold text-slate-700 capitalize">{selectedOrder.inventoryStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Placed Time</span>
                <span className="text-slate-600 font-medium">
                  {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Items Snapshot */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchased Recipe Breakdown</h4>
              <div className="divide-y divide-slate-100">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-start text-xs">
                    <div>
                      <p className="font-bold text-[#001F3F] text-sm">{it.quantity} × {it.name}</p>
                      {it.itemType === 'custom' && it.customPizza && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
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

            {/* Delivery Destination */}
            <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-[#001F3F] block">Delivery Destination</span>
              <p className="font-medium text-slate-800">{selectedOrder.deliveryAddress?.fullName} ({selectedOrder.deliveryAddress?.phone})</p>
              <p className="text-slate-600">{selectedOrder.deliveryAddress?.street}, {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} - {selectedOrder.deliveryAddress?.postalCode}</p>
              {selectedOrder.deliveryAddress?.instructions && (
                <p className="text-slate-500 italic pt-1">Note: "{selectedOrder.deliveryAddress.instructions}"</p>
              )}
            </div>

            {/* Financials */}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline text-xs text-slate-600">
              <span>Grand Total (Paid in INR):</span>
              <span className="text-xl font-black text-[#00804C]">{formatINR(selectedOrder.grandTotalPaise)}</span>
            </div>

            {/* Admin Transition Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              {selectedOrder.orderStatus !== 'cancelled' && selectedOrder.orderStatus !== 'delivered' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    const reason = window.prompt('Please enter cancellation reason for inventory rollback:');
                    if (reason) {
                      handleStatusTransition(selectedOrder.id, 'cancelled', reason);
                    }
                  }}
                >
                  Cancel Order & Restore Stock
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="ml-auto"
              >
                Close Receipt
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;

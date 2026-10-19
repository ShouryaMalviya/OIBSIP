import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/admin.service';
import socketService from '../../services/socket.service';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import toast from 'react-hot-toast';
import {
  Boxes,
  AlertTriangle,
  XCircle,
  Clock,
  ChefHat,
  Bike,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Pizza,
  Wifi,
} from 'lucide-react';
import { formatINR } from '../../utils/pricing';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardMetrics();
      setMetrics(response.data);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to load operational metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Subscribe to real-time administrative events
  useEffect(() => {
    const unsub = socketService.subscribeToAdmin({
      onOrderUpdated: () => {
        fetchMetrics();
      },
      onNewOrder: (data) => {
        toast.success(`🍕 New order arrived: #${data.orderNumber} (${formatINR(data.grandTotalPaise)})`, {
          icon: '🔔',
          duration: 4000,
        });
        fetchMetrics();
      },
      onInventoryAlert: (alert) => {
        toast.error(`⚠️ Low-Stock Alert: ${alert.itemName} (${alert.currentStock} ${alert.unit || 'portions'} left)`, {
          duration: 6000,
        });
        fetchMetrics();
      },
      onStockChange: () => {
        fetchMetrics();
      },
    });

    return unsub;
  }, [fetchMetrics]);

  const handleTriggerScan = async () => {
    try {
      setScanning(true);
      const res = await adminService.triggerLowStockScan();
      toast.success(
        `Low-stock scan finished: ${res.data.alertsTriggered} alert(s) sent, ${res.data.deduplicatedSkipped} skipped (deduplicated).`
      );
      await fetchMetrics();
    } catch (err) {
      toast.error('Scan trigger failed.');
    } finally {
      setScanning(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <SkeletonLoader variant="card" count={3} />
      </div>
    );
  }

  const { inventory = {}, orders = {}, financial = {}, recentOrders = [] } = metrics || {};

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Badge variant="bookGreen" size="sm" className="mb-2">Operational Overview</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight font-display">
            Live Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time synchronization across artisan recipe inventory, oven queues, and delivery dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchMetrics}
            loading={loading}
          >
            Refresh Data
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ShieldAlert}
            onClick={handleTriggerScan}
            loading={scanning}
          >
            Scan Low Stock Now
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Active Inventory Items */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Inventory</span>
            <div className="w-10 h-10 rounded-2xl bg-[#F6F7ED] flex items-center justify-center text-[#00804C]">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-[#001F3F]">{inventory.totalActiveItems || 0}</span>
            <span className="text-xs text-slate-500 block mt-0.5">Tracked Recipe Ingredients</span>
          </div>
          <Link to="/admin/inventory" className="text-xs font-semibold text-[#00804C] hover:underline flex items-center gap-1 pt-1">
            <span>Manage Stock</span> <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Low Stock Items Warning */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Warnings</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className={`text-3xl font-black ${inventory.lowStockCount > 0 ? 'text-amber-600' : 'text-[#001F3F]'}`}>
              {inventory.lowStockCount || 0}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">At or Below Threshold</span>
          </div>
          <Link to="/admin/alerts" className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1 pt-1">
            <span>View Alerts & Dedup Logs</span> <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Kitchen Oven Queue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In-Kitchen Baking</span>
            <div className="w-10 h-10 rounded-2xl bg-[#DBE64C]/20 flex items-center justify-center text-[#001F3F]">
              <ChefHat className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-[#001F3F]">{orders.inKitchenCount || 0}</span>
            <span className="text-xs text-slate-500 block mt-0.5">Active Oven Tickets</span>
          </div>
          <Link to="/admin/orders" className="text-xs font-semibold text-[#00804C] hover:underline flex items-center gap-1 pt-1">
            <span>Fulfillment Pipeline</span> <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Confirmed Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#00804C]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-[#00804C]">{financial.totalRevenueFormatted || '₹0'}</span>
            <span className="text-xs text-slate-500 block mt-0.5">Paid Razorpay Orders</span>
          </div>
          <span className="text-xs font-medium text-slate-400 block pt-1">
            {orders.totalOrdersCount || 0} Total Orders Placed
          </span>
        </div>

      </div>

      {/* Secondary Status Pipeline Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#001F3F] text-white p-6 rounded-3xl space-y-2">
          <span className="text-xs font-bold text-[#DBE64C] uppercase tracking-wider">Orders Received</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black">{orders.receivedCount || 0}</span>
            <span className="text-xs text-white/60">Awaiting Kitchen</span>
          </div>
        </div>

        <div className="bg-[#1E488F] text-white p-6 rounded-3xl space-y-2">
          <span className="text-xs font-bold text-[#74C365] uppercase tracking-wider">Out for Delivery</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black">{orders.sentToDeliveryCount || 0}</span>
            <span className="text-xs text-white/60">On Road En Route</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Out of Stock Items</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-black ${inventory.outOfStockCount > 0 ? 'text-red-600' : 'text-[#00804C]'}`}>
              {inventory.outOfStockCount || 0}
            </span>
            <span className="text-xs text-slate-500">Requires Emergency Restock</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-[#001F3F]">Recent Incoming Orders</h2>
            <p className="text-xs text-slate-500">Live order tickets with server status synchronization</p>
          </div>
          <Link to="/admin/orders">
            <Button variant="outline" size="sm" icon={ExternalLink}>
              View All Orders
            </Button>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No orders placed yet. Orders will appear here as customers complete checkout.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-bold">Order #</th>
                  <th className="pb-3 font-bold">Customer</th>
                  <th className="pb-3 font-bold">Pizzas Ordered</th>
                  <th className="pb-3 font-bold">Amount</th>
                  <th className="pb-3 font-bold">Payment</th>
                  <th className="pb-3 font-bold">Order Status</th>
                  <th className="pb-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((ord) => (
                  <tr key={ord.id || ord._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-[#001F3F]">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3.5">
                      <p className="font-semibold text-slate-800">{ord.deliveryAddress?.fullName || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400">{ord.deliveryAddress?.city}</p>
                    </td>
                    <td className="py-3.5 max-w-xs truncate text-slate-600">
                      {ord.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                    </td>
                    <td className="py-3.5 font-bold text-[#00804C]">
                      {formatINR(ord.grandTotalPaise)}
                    </td>
                    <td className="py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.paymentStatus === 'paid' ? 'bg-emerald-50 text-[#00804C]' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {ord.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="text-[11px] font-semibold text-slate-700 capitalize">
                        {ord.orderStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        to="/admin/orders"
                        className="text-xs font-bold text-[#1E488F] hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};

export default AdminDashboard;

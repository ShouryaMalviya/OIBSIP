import React, { useEffect, useState, useCallback } from 'react';
import adminService from '../../services/admin.service';
import socketService from '../../services/socket.service';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import toast from 'react-hot-toast';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  History,
  Sliders,
} from 'lucide-react';

export const AdminInventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals state
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [adjustData, setAdjustData] = useState({ amount: '', reason: '' });
  const [adjusting, setAdjusting] = useState(false);

  const [thresholdModalItem, setThresholdModalItem] = useState(null);
  const [thresholdValue, setThresholdValue] = useState(10);
  const [updatingThreshold, setUpdatingThreshold] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({
    name: '',
    category: 'vegetable',
    sku: '',
    currentStock: 50,
    lowStockThreshold: 10,
    unit: 'portions',
    description: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getInventory({
        category: category !== 'all' ? category : undefined,
        search: search.trim() || undefined,
        stockStatus: stockStatus !== 'all' ? stockStatus : undefined,
      });
      setItems(res.data?.items || []);
    } catch (err) {
      toast.error('Failed to load inventory ledger.');
    } finally {
      setLoading(false);
    }
  }, [category, search, stockStatus]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Subscribe to real-time stock adjustment broadcasts
  useEffect(() => {
    const unsub = socketService.subscribeToAdmin({
      onStockChange: (updatedItem) => {
        console.log('[AdminInventory] Real-time stock change received:', updatedItem);
        setItems((prev) =>
          prev.map((it) =>
            it.id === updatedItem.id || it.sku === updatedItem.sku ? { ...it, ...updatedItem } : it
          )
        );
      },
    });
    return unsub;
  }, []);

  // Handle Manual Stock Adjustment
  const handleStockAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    const amount = parseInt(adjustData.amount, 10);
    if (isNaN(amount) || amount === 0) {
      toast.error('Adjustment amount must be a non-zero integer.');
      return;
    }

    if (!adjustData.reason.trim()) {
      toast.error('An explicit audit reason is required.');
      return;
    }

    try {
      setAdjusting(true);
      await adminService.adjustStock(adjustModalItem.id, {
        adjustmentAmount: amount,
        reason: adjustData.reason.trim(),
      });
      toast.success(`Stock adjusted for "${adjustModalItem.name}".`);
      setAdjustModalItem(null);
      setAdjustData({ amount: '', reason: '' });
      await fetchInventory();
    } catch (err) {
      toast.error(err.userMessage || 'Adjustment failed.');
    } finally {
      setAdjusting(false);
    }
  };

  // Handle Threshold Update
  const handleThresholdSubmit = async (e) => {
    e.preventDefault();
    if (!thresholdModalItem) return;

    try {
      setUpdatingThreshold(true);
      await adminService.updateInventoryItem(thresholdModalItem.id, {
        lowStockThreshold: parseInt(thresholdValue, 10),
      });
      toast.success(`Threshold updated for "${thresholdModalItem.name}".`);
      setThresholdModalItem(null);
      await fetchInventory();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to update threshold.');
    } finally {
      setUpdatingThreshold(false);
    }
  };

  // Handle Create New Inventory Item
  const handleCreateItemSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await adminService.createInventoryItem(createData);
      toast.success(`Item "${createData.name}" created successfully.`);
      setCreateModalOpen(false);
      setCreateData({
        name: '',
        category: 'vegetable',
        sku: '',
        currentStock: 50,
        lowStockThreshold: 10,
        unit: 'portions',
        description: '',
      });
      await fetchInventory();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create inventory item.');
    } finally {
      setCreating(false);
    }
  };

  // Sorted items
  const sortedItems = [...items].sort((a, b) => {
    if (sortField === 'stock') {
      return sortOrder === 'asc' ? a.currentStock - b.currentStock : b.currentStock - a.currentStock;
    }
    return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Badge variant="bookGreen" size="sm" className="mb-2">Warehouse & Recipe Matrix</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight font-display">
            Inventory Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time ingredient levels, batch adjustments, and low-stock safety thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchInventory}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Add Inventory Item
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'pizza_base', label: 'Pizza Crusts' },
            { id: 'sauce', label: 'Artisan Sauces' },
            { id: 'cheese', label: 'Cheeses' },
            { id: 'vegetable', label: 'Vegetables & Herbs' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                category === cat.id
                  ? 'bg-[#001F3F] text-[#DBE64C] shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Stock Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 border-t border-slate-100">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ingredient name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00804C]"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#00804C]"
            >
              <option value="all">All Stock Levels</option>
              <option value="healthy">Healthy Stock</option>
              <option value="low">Low Stock Only</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={() => {
                if (sortField === 'stock') {
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                } else {
                  setSortField('stock');
                  setSortOrder('asc');
                }
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort by Stock ({sortField === 'stock' ? (sortOrder === 'asc' ? 'Lowest' : 'Highest') : 'Default'})</span>
            </button>
          </div>
        </div>

      </div>

      {/* Inventory Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {loading && items.length === 0 ? (
          <div className="p-8 space-y-4">
            <SkeletonLoader variant="card" count={2} />
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm space-y-2">
            <Boxes className="w-10 h-10 mx-auto text-slate-300" />
            <p>No inventory items match your current filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-6">Ingredient & SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Safety Threshold</th>
                  <th className="py-3.5 px-4">Health Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedItems.map((item) => {
                  const isLow = item.currentStock <= item.lowStockThreshold && item.currentStock > 0;
                  const isOut = item.currentStock === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-extrabold text-[#001F3F] text-sm">{item.name}</p>
                        <span className="font-mono text-[10px] text-slate-400 uppercase">{item.sku}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md capitalize">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold">
                        <span className="text-base font-black text-[#001F3F]">{item.currentStock}</span>{' '}
                        <span className="text-slate-400 text-[11px] font-normal">{item.unit}</span>
                      </td>

                      <td className="py-4 px-4">
                        <button
                          onClick={() => {
                            setThresholdModalItem(item);
                            setThresholdValue(item.lowStockThreshold);
                          }}
                          className="group flex items-center gap-1.5 text-slate-600 hover:text-[#00804C] font-semibold"
                          title="Click to edit threshold"
                        >
                          <span>{item.lowStockThreshold} {item.unit}</span>
                          <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-[#00804C]" />
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3 shrink-0" /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3 shrink-0" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#00804C]">
                            <CheckCircle2 className="w-3 h-3 shrink-0" /> Healthy ({item.currentStock})
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Sliders}
                          onClick={() => {
                            setAdjustModalItem(item);
                            setAdjustData({ amount: '', reason: '' });
                          }}
                        >
                          Adjust
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

      {/* MODAL 1: Adjust Stock Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventory Adjustment</span>
                <h3 className="text-lg font-black text-[#001F3F]">{adjustModalItem.name}</h3>
              </div>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Current Stock:</span>
                <span className="font-extrabold text-[#001F3F]">{adjustModalItem.currentStock} {adjustModalItem.unit}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SKU:</span>
                <span className="font-mono text-[10px]">{adjustModalItem.sku}</span>
              </div>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-4">
              <Input
                label="Adjustment Amount (+ to add stock, - to deduct) *"
                type="number"
                value={adjustData.amount}
                onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                required
                placeholder="e.g. +25 or -5"
              />

              <Input
                label="Traceable Audit Reason *"
                value={adjustData.reason}
                onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                required
                placeholder="e.g. Batch supplier delivery #582 or Kitchen waste"
              />

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustModalItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={adjusting}
                >
                  Record Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Threshold Modal */}
      {thresholdModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-[#001F3F]">Safety Threshold</h3>
              <button
                onClick={() => setThresholdModalItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Configure minimum safety threshold for <strong>{thresholdModalItem.name}</strong>. An email warning is dispatched when stock drops to or below this level.
            </p>

            <form onSubmit={handleThresholdSubmit} className="space-y-4">
              <Input
                label="Low Stock Threshold (Units) *"
                type="number"
                min="0"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setThresholdModalItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={updatingThreshold}
                >
                  Save Threshold
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add New Inventory Item Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventory Catalog</span>
                <h3 className="text-lg font-black text-[#001F3F]">Add New Inventory Item</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItemSubmit} className="space-y-4">
              <Input
                label="Ingredient / Item Name *"
                value={createData.name}
                onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                required
                placeholder="e.g. Buffalo Mozzarella DOP"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Category *</label>
                  <select
                    value={createData.category}
                    onChange={(e) => setCreateData({ ...createData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#00804C]"
                  >
                    <option value="pizza_base">Pizza Crust</option>
                    <option value="sauce">Artisan Sauce</option>
                    <option value="cheese">Cheese</option>
                    <option value="vegetable">Vegetable / Herb</option>
                  </select>
                </div>

                <Input
                  label="Unique SKU Code *"
                  value={createData.sku}
                  onChange={(e) => setCreateData({ ...createData, sku: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g. CHEESE-BUF-02"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Initial Stock *"
                  type="number"
                  min="0"
                  value={createData.currentStock}
                  onChange={(e) => setCreateData({ ...createData, currentStock: e.target.value })}
                  required
                />
                <Input
                  label="Threshold *"
                  type="number"
                  min="0"
                  value={createData.lowStockThreshold}
                  onChange={(e) => setCreateData({ ...createData, lowStockThreshold: e.target.value })}
                  required
                />
                <Input
                  label="Unit *"
                  value={createData.unit}
                  onChange={(e) => setCreateData({ ...createData, unit: e.target.value })}
                  required
                  placeholder="portions"
                />
              </div>

              <Input
                label="Optional Description"
                value={createData.description}
                onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                placeholder="Supplier origin and flavor profile notes"
              />

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={creating}
                >
                  Create Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminInventory;

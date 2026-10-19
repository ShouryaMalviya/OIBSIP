import React, { useEffect, useState, useCallback } from 'react';
import adminService from '../../services/admin.service';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import toast from 'react-hot-toast';
import { History, RefreshCw, ArrowUpRight, ArrowDownRight, ShieldCheck, User } from 'lucide-react';

export const AdminAdjustments = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getAdjustmentLogs(100);
      setLogs(res.data?.logs || []);
    } catch (err) {
      toast.error('Failed to load adjustment audit logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getTypeBadge = (type) => {
    switch (type) {
      case 'order_deduction':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Order Deduction</span>;
      case 'cancellation_restock':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Cancellation Restock</span>;
      case 'initial_seed':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Initial Baseline Seed</span>;
      case 'manual_adjustment':
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">Manual Adjustment</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Badge variant="bookGreen" size="sm" className="mb-2">Compliance & Traceability</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight font-display">
            Stock Adjustment Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete immutable log of every inventory addition, kitchen deduction, supplier restock, and restoration.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchLogs}
          loading={loading}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Audit Log Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {loading && logs.length === 0 ? (
          <div className="p-8 space-y-4">
            <SkeletonLoader variant="card" count={3} />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm space-y-2">
            <History className="w-10 h-10 mx-auto text-slate-300" />
            <p>No inventory adjustments logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-4">Item & SKU</th>
                  <th className="py-3.5 px-4">Change</th>
                  <th className="py-3.5 px-4">Stock Transition</th>
                  <th className="py-3.5 px-4">Classification</th>
                  <th className="py-3.5 px-4">Traceable Reason</th>
                  <th className="py-3.5 px-6 text-right">Acting Authority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const isPositive = log.adjustmentAmount > 0;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#001F3F] text-sm">{log.itemName}</p>
                        <span className="font-mono text-[10px] text-slate-400 uppercase">{log.itemSku}</span>
                      </td>

                      <td className="py-3.5 px-4 font-black">
                        <span className={`inline-flex items-center gap-0.5 text-xs font-black ${
                          isPositive ? 'text-[#00804C]' : 'text-red-600'
                        }`}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isPositive ? `+${log.adjustmentAmount}` : log.adjustmentAmount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                        {log.previousQuantity} → <strong className="text-[#001F3F]">{log.newQuantity}</strong>
                      </td>

                      <td className="py-3.5 px-4">
                        {getTypeBadge(log.type)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate" title={log.reason}>
                        {log.reason}
                        {log.relatedOrderId && (
                          <span className="block font-mono text-[10px] text-slate-400">
                            Ref: {log.relatedOrderId}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right font-semibold text-slate-600">
                        {log.adminName || 'System'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};

export default AdminAdjustments;

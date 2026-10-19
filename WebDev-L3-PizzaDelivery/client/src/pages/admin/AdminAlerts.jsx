import React, { useEffect, useState, useCallback } from 'react';
import adminService from '../../services/admin.service';
import socketService from '../../services/socket.service';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import toast from 'react-hot-toast';
import {
  BellRing,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Mail,
} from 'lucide-react';

export const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getLowStockAlerts();
      setAlerts(res.data?.alerts || []);
    } catch (err) {
      toast.error('Failed to load alert history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Subscribe to real-time low-stock alerts
  useEffect(() => {
    const unsub = socketService.subscribeToAdmin({
      onInventoryAlert: (newAlert) => {
        console.log('[AdminAlerts] New real-time alert received:', newAlert);
        setAlerts((prev) => [newAlert, ...prev]);
      },
    });
    return unsub;
  }, []);

  const handleManualScan = async () => {
    try {
      setScanning(true);
      const res = await adminService.triggerLowStockScan();
      toast.success(
        `Scan complete! Dispatched ${res.data.alertsTriggered} new alert(s), skipped ${res.data.deduplicatedSkipped} deduplicated item(s).`
      );
      await fetchAlerts();
    } catch (err) {
      toast.error('Low-stock scan failed.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Badge variant="bookGreen" size="sm" className="mb-2">Automated Warehouse Watcher</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight font-display">
            Low-Stock Alert Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit history of automated email notifications, recipient deliveries, and deduplication states.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchAlerts}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ShieldAlert}
            onClick={handleManualScan}
            loading={scanning}
          >
            Run Low-Stock Scan Now
          </Button>
        </div>
      </div>

      {/* Explanatory Policy Card */}
      <div className="bg-[#001F3F] text-white p-6 rounded-3xl space-y-3">
        <div className="flex items-center gap-2 text-[#DBE64C] font-bold text-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>Automated node-cron & Alert Deduplication Policy</span>
        </div>
        <p className="text-xs text-white/80 leading-relaxed max-w-3xl">
          The PizzaVerse warehouse scheduler runs continuously. When an ingredient breaches its safety threshold, a warning email is automatically dispatched to the administration address. To prevent email flooding, subsequent scans deduplicate and skip notifying until the stock is replenished above threshold and later drops again.
        </p>
      </div>

      {/* Alerts Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {loading && alerts.length === 0 ? (
          <div className="p-8 space-y-4">
            <SkeletonLoader variant="card" count={2} />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm space-y-2">
            <BellRing className="w-10 h-10 mx-auto text-slate-300" />
            <p>No low-stock alerts recorded yet. All ingredients are operating at healthy levels.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-6">Triggered At</th>
                  <th className="py-3.5 px-4">Item & SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Breach Metric</th>
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Dispatch Status</th>
                  <th className="py-3.5 px-6 text-right">Delivery Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((al) => {
                  const isSent = al.status === 'sent';
                  const isFailed = al.status === 'failed';

                  return (
                    <tr key={al.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(al.triggeredAt || al.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-extrabold text-[#001F3F] text-sm">{al.itemName}</p>
                        <span className="font-mono text-[10px] text-slate-400 uppercase">{al.itemSku}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md capitalize">
                          {al.category.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-red-600">{al.currentStock}</span>
                        <span className="text-slate-400 text-[11px]"> / {al.threshold} min</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 truncate max-w-xs">
                        {al.recipientEmail}
                      </td>

                      <td className="py-3.5 px-4">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#00804C]">
                            <CheckCircle2 className="w-3 h-3" /> Sent Successfully
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3" /> Delivery Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Skipped (Deduplicated)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right font-mono text-[11px] text-slate-500 max-w-xs truncate" title={al.deliveryOutcome}>
                        {al.deliveryOutcome || 'Completed'}
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

export default AdminAlerts;

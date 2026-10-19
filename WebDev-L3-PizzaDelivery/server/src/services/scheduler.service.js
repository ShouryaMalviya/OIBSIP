import cron from 'node-cron';
import { InventoryItem } from '../models/InventoryItem.js';
import { LowStockAlert } from '../models/LowStockAlert.js';
import { sendLowStockAlertEmail } from './mail.service.js';
import { env } from '../config/env.js';
import { emitInventoryAlert } from '../socket/index.js';

let scheduledTask = null;
let isCheckRunning = false;

/**
 * Scan active inventory items and dispatch deduplicated low-stock alerts
 */
export async function runInventoryLowStockCheck() {
  if (isCheckRunning) {
    console.log('[SCHEDULER] Low-stock scan already in progress. Skipping overlapping execution.');
    return { skipped: true, reason: 'concurrent_execution_in_progress' };
  }

  isCheckRunning = true;
  const results = {
    scanned: 0,
    alertsTriggered: 0,
    deduplicatedSkipped: 0,
    failed: 0,
    details: [],
  };

  try {
    const items = await InventoryItem.find({ isActive: true });
    results.scanned = items.length;

    for (const item of items) {
      const isLow = item.currentStock <= item.lowStockThreshold;

      if (isLow) {
        // DEDUPLICATION CHECK:
        // If an alert was already dispatched during this low-stock state, skip repeated emailing!
        if (item.alertSentForLowStock) {
          results.deduplicatedSkipped++;
          results.details.push({
            sku: item.sku,
            name: item.name,
            action: 'skipped_already_alerted',
          });
          continue;
        }

        // Send alert
        try {
          const info = await sendLowStockAlertEmail({
            to: env.ADMIN_NOTIFICATION_EMAIL,
            itemName: item.name,
            category: item.category,
            currentStock: item.currentStock,
            threshold: item.lowStockThreshold,
            unit: item.unit,
            sku: item.sku,
          });

          // Mark item as alerted
          item.alertSentForLowStock = true;
          item.lastAlertSentAt = new Date();
          await item.save();

          // Record alert audit log
          const alertRecord = new LowStockAlert({
            inventoryItemId: item.id,
            itemSku: item.sku,
            itemName: item.name,
            category: item.category,
            currentStock: item.currentStock,
            threshold: item.lowStockThreshold,
            recipientEmail: env.ADMIN_NOTIFICATION_EMAIL,
            status: 'sent',
            deliveryOutcome: info?.messageId || 'Delivered to SMTP transport',
          });
          await alertRecord.save();

          emitInventoryAlert(alertRecord);

          results.alertsTriggered++;
          results.details.push({
            sku: item.sku,
            name: item.name,
            action: 'alert_sent',
          });
        } catch (mailError) {
          console.error(`[SCHEDULER ERROR] Failed to send alert for "${item.name}":`, mailError.message);
          
          // Record failure audit log for diagnosis
          const failedRecord = new LowStockAlert({
            inventoryItemId: item.id,
            itemSku: item.sku,
            itemName: item.name,
            category: item.category,
            currentStock: item.currentStock,
            threshold: item.lowStockThreshold,
            recipientEmail: env.ADMIN_NOTIFICATION_EMAIL,
            status: 'failed',
            deliveryOutcome: `SMTP Error: ${mailError.message}`,
          });
          await failedRecord.save();

          results.failed++;
          results.details.push({
            sku: item.sku,
            name: item.name,
            action: 'failed',
            error: mailError.message,
          });
        }
      } else {
        // If item stock is healthy (above threshold), reset the alert trigger flag
        // This allows a new alert to be sent if stock subsequently drops below threshold again
        if (item.alertSentForLowStock) {
          item.alertSentForLowStock = false;
          await item.save();
        }
      }
    }

    console.log(
      `[SCHEDULER] Low-stock scan completed. Scanned: ${results.scanned}, Alerts Sent: ${results.alertsTriggered}, Deduplicated: ${results.deduplicatedSkipped}, Failed: ${results.failed}`
    );
  } catch (error) {
    console.error('[SCHEDULER ERROR] Inventory check encountered an exception:', error.message);
  } finally {
    isCheckRunning = false;
  }

  return results;
}

/**
 * Initialize node-cron scheduled job
 * In multi-instance production environments, this scheduler should either run on a single dedicated
 * worker instance (e.g. cron worker pod) or use a distributed redis lock to coordinate single execution.
 */
export function startInventoryScheduler() {
  const cronExpression = env.INVENTORY_CHECK_CRON || '0 * * * *';

  if (!cron.validate(cronExpression)) {
    console.warn(`[SCHEDULER WARNING] Invalid cron expression: "${cronExpression}". Falling back to hourly "0 * * * *".`);
  }

  const validExpr = cron.validate(cronExpression) ? cronExpression : '0 * * * *';

  if (scheduledTask) {
    scheduledTask.stop();
  }

  console.log(`[SCHEDULER] Initializing node-cron automated low-stock watcher with schedule: "${validExpr}"`);

  scheduledTask = cron.schedule(validExpr, () => {
    runInventoryLowStockCheck();
  });

  return scheduledTask;
}

export function stopInventoryScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[SCHEDULER] Stopped inventory low-stock scheduler.');
  }
}

export default {
  startInventoryScheduler,
  stopInventoryScheduler,
  runInventoryLowStockCheck,
};

/**
 * Utility to send critical alerts to Telegram channel
 */

type AlertSeverity = 'critical' | 'error' | 'warning' | 'info';

interface AlertPayload {
  message: string;
  severity?: AlertSeverity;
  service: string;
  details?: any;
}

interface AlertResponse {
  success: boolean;
  messageSent: boolean;
  messageId?: number;
  error?: string;
}

/**
 * Send an alert to the configured Telegram channel
 *
 * @param payload - Alert information
 * @returns Promise with the result
 *
 * @example
 * ```typescript
 * await sendTelegramAlert({
 *   message: 'Fiat rate service is down',
 *   severity: 'critical',
 *   service: 'Fiat Currency API',
 *   details: { error: 'getAllFiatRate returned null' }
 * });
 * ```
 */
export async function sendTelegramAlert(payload: AlertPayload): Promise<AlertResponse> {
  try {
    // Use internal token for authentication (server will check against env var or use default)
    // Note: This token will be visible in client bundle, but that's acceptable for internal monitoring
    // The endpoint is primarily meant to prevent random internet abuse, not sophisticated attacks
    const internalToken = 'internal-alert-secret-token';

    const response = await fetch('/api/alerts/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-alert-token': internalToken
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to send Telegram alert:', data);
      return {
        success: false,
        messageSent: false,
        error: data.error || 'Unknown error'
      };
    }

    return data;
  } catch (error) {
    console.error('Error calling Telegram alert API:', error);
    return {
      success: false,
      messageSent: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Send a critical alert (for immediate attention issues)
 */
export function sendCriticalAlert(service: string, message: string, details?: any) {
  return sendTelegramAlert({
    message,
    severity: 'critical',
    service,
    details
  });
}

/**
 * Send an error alert
 */
export function sendErrorAlert(service: string, message: string, details?: any) {
  return sendTelegramAlert({
    message,
    severity: 'error',
    service,
    details
  });
}

/**
 * Send a warning alert
 */
export function sendWarningAlert(service: string, message: string, details?: any) {
  return sendTelegramAlert({
    message,
    severity: 'warning',
    service,
    details
  });
}

/**
 * Send an info alert
 */
export function sendInfoAlert(service: string, message: string, details?: any) {
  return sendTelegramAlert({
    message,
    severity: 'info',
    service,
    details
  });
}

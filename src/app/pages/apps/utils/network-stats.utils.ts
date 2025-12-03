/**
 * Utility functions for calculating network statistics from app network interfaces.
 */

export interface NetworkStats {
  rx_bytes?: number;
  tx_bytes?: number;
}

export interface TrafficStats {
  incoming: number;
  outgoing: number;
}

/**
 * Safely adds two numbers, treating null/undefined/NaN as 0.
 */
function safeAdd(a: number | null | undefined, b: number | null | undefined): number {
  const numA = typeof a === 'number' && !Number.isNaN(a) ? a : 0;
  const numB = typeof b === 'number' && !Number.isNaN(b) ? b : 0;
  return numA + numB;
}

/**
 * Calculates total network traffic (in bits) from an array of network interfaces.
 * Converts bytes to bits by multiplying by 8.
 *
 * @param networks Array of network interface statistics
 * @returns Object containing incoming (rx) and outgoing (tx) traffic in bits
 *
 * @example
 * const stats = calculateNetworkTraffic([
 *   { rx_bytes: 1000, tx_bytes: 2000 },
 *   { rx_bytes: 500, tx_bytes: 1500 }
 * ]);
 * // returns { incoming: 12000, outgoing: 28000 }
 */
export function calculateNetworkTraffic(
  networks: NetworkStats[] | null | undefined,
): TrafficStats {
  if (!Array.isArray(networks) || networks.length === 0) {
    return { incoming: 0, outgoing: 0 };
  }

  return networks.reduce((acc, stats) => ({
    incoming: safeAdd(acc.incoming, (stats.rx_bytes || 0) * 8),
    outgoing: safeAdd(acc.outgoing, (stats.tx_bytes || 0) * 8),
  }), { incoming: 0, outgoing: 0 });
}

/**
 * Calculates the sum of a specific network field (rx_bytes or tx_bytes) across all interfaces.
 *
 * @param networks Array of network interface statistics
 * @param field The field to sum ('rx_bytes' or 'tx_bytes')
 * @returns Total bytes for the specified field
 *
 * @example
 * const totalRx = sumNetworkField([
 *   { rx_bytes: 1000, tx_bytes: 2000 },
 *   { rx_bytes: 500, tx_bytes: 1500 }
 * ], 'rx_bytes');
 * // returns 1500
 */
export function sumNetworkField(
  networks: NetworkStats[] | null | undefined,
  field: 'rx_bytes' | 'tx_bytes',
): number {
  if (!Array.isArray(networks) || networks.length === 0) {
    return 0;
  }

  return networks.reduce((sum, net) => {
    const value = net?.[field];
    return safeAdd(sum, value);
  }, 0);
}

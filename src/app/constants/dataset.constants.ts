export const maxDatasetPath = 200;
export const maxDatasetNesting = 50;

/**
 * Special VDEV configuration constants
 *
 * In ZFS, the special_small_block_size property controls which blocks are stored in special vdevs.
 * - Blocks smaller than or equal to this value will be allocated to special vdevs
 * - Blocks larger than this value will use regular vdevs
 * - Default recommended value is 16 MiB when enabled
 * - Setting to 0 disables special vdev usage
 * - Valid range: any positive integer (1 byte to 16 MiB)
 */
export const specialVdevDefaultThreshold = 16 * 1024 * 1024; // 16 MiB
export const specialVdevMinThreshold = 1; // Minimum: 1 byte
export const specialVdevMaxThreshold = specialVdevDefaultThreshold; // 16 MiB

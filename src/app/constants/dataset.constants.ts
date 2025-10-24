export const maxDatasetPath = 200;
export const maxDatasetNesting = 50;

/**
 * Special VDEV configuration constants
 *
 * In ZFS, the special_small_block_size property controls which blocks are stored in special vdevs.
 * - Setting to 16 MiB (or greater) effectively disables special vdev usage
 * - Setting to values < 16 MiB enables special vdev storage for blocks up to that size
 * - Default recommended value is 128 KiB for optimal metadata performance
 */
export const specialVdevDisableThreshold = 16 * 1024 * 1024; // 16 MiB
export const specialVdevDefaultThreshold = 128 * 1024; // 128 KiB
export const specialVdevMinThreshold = 512; // 512 bytes (minimum sector size)
export const specialVdevMaxThreshold = specialVdevDisableThreshold; // 16 MiB

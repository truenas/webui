export const maxDatasetPath = 200;
export const maxDatasetNesting = 50;

/**
 * Bounds for ZFS `special_small_block_size`: blocks at or below it go to special vdevs, larger ones
 * to regular vdevs, and 0 disables special vdev usage. 16 MiB is both the recommended value and the max.
 */
export const specialVdevDefaultThreshold = 16 * 1024 * 1024; // 16 MiB
export const specialVdevMinThreshold = 1; // Minimum: 1 byte
export const specialVdevMaxThreshold = specialVdevDefaultThreshold; // 16 MiB

export const minimumPbkdf2Iterations = 1300000;

import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextTiering = {
  description: T('Tiering lets you place datasets on the Performance tier (the special vdev) or the Regular tier. It is manual: new data follows a dataset\'s tier, and existing data moves only when you change a dataset\'s tier with "Move existing data". Nothing moves automatically or on a schedule.'),

  enabledTooltip: T('Allows datasets to be moved between the Performance and Regular tiers. Turning this on does not move any data by itself.'),

  enabledWarningHeading: T('Shares will be locked to a single dataset'),
  enabledWarningMessage: T('Once tiering is on, SMB shares and Webshares stop following nested datasets. Each share will expose only its own dataset, and any child datasets under it will no longer be visible to clients through that share. Create a separate share for each dataset you want to expose.'),

  maxConcurrentJobs: T('Maximum number of tiering jobs that can run at the same time ({min}–{max}). Higher values speed up data movement between tiers but increase CPU and I/O load on the system. Extra jobs wait in a queue.'),
  maxUsedPercentage: T('Tiering jobs stop moving data when the pool reaches this percentage full ({min}–{max}). This keeps tiering from using up the last of the pool\'s free space.'),
  performanceTierReserve: T('Percentage of the performance tier kept in reserve ({min}–{max}). When only this much space is left on the performance tier, new data goes to the regular tier instead. Shown as reserved space on the pool Usage card.'),
};

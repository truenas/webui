import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { diskStatusTint } from 'app/pages/system/enclosure/utils/disk-status-tint.utils';

describe('diskStatusTint', () => {
  it('returns null when pool info is not available', () => {
    const slot = {
      pool_info: null,
    } as DashboardEnclosureSlot;
    expect(diskStatusTint(slot)).toBeNull();
  });

  it('returns green when disk status is online', () => {
    const slot = {
      pool_info: {
        disk_status: EnclosureDiskStatus.Online,
      },
    } as DashboardEnclosureSlot;
    expect(diskStatusTint(slot)).toBe('var(--green)');
  });

  it('returns orange when disk status is degraded', () => {
    const slot = {
      pool_info: {
        disk_status: EnclosureDiskStatus.Degraded,
      },
    } as DashboardEnclosureSlot;
    expect(diskStatusTint(slot)).toBe('var(--orange)');
  });

  it('returns red when disk status is faulted', () => {
    const slot = {
      pool_info: {
        disk_status: EnclosureDiskStatus.Faulted,
      },
    } as DashboardEnclosureSlot;
    expect(diskStatusTint(slot)).toBe('var(--red)');
  });

  it('returns yellow when disk status is unknown', () => {
    const slot = {
      pool_info: {
        disk_status: EnclosureDiskStatus.Unknown,
      },
    } as DashboardEnclosureSlot;
    expect(diskStatusTint(slot)).toBe('var(--yellow)');
  });

  it('returns grey when disk status is offline', () => {
    const slot = {
      pool_info: {
        disk_status: EnclosureDiskStatus.Offline,
      },
    } as DashboardEnclosureSlot;
    expect(diskStatusTint(slot)).toBe('var(--grey)');
  });
});

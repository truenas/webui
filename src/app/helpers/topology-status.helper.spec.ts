import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import {
  getEffectiveStatus,
  getStatusSeverity,
  getStatusThemeClass,
  worstDescendantStatus,
} from 'app/helpers/topology-status.helper';
import { TopologyDisk, VDev, VDevItem } from 'app/interfaces/storage.interface';

function makeDisk(status: TopologyItemStatus | undefined): TopologyDisk {
  return { type: TopologyItemType.Disk, status, children: [] } as TopologyDisk;
}

function makeRaidz(status: TopologyItemStatus | undefined, children: VDevItem[]): VDev {
  return { type: TopologyItemType.Raidz3, status, children } as VDev;
}

describe('topology-status.helper', () => {
  describe('getStatusSeverity', () => {
    it('ranks faulted/unavail highest, degraded next, offline/removed lowest', () => {
      expect(getStatusSeverity(TopologyItemStatus.Faulted)).toBe(3);
      expect(getStatusSeverity(TopologyItemStatus.Unavail)).toBe(3);
      expect(getStatusSeverity(TopologyItemStatus.Degraded)).toBe(2);
      expect(getStatusSeverity(TopologyItemStatus.Offline)).toBe(1);
      expect(getStatusSeverity(TopologyItemStatus.Removed)).toBe(1);
    });

    it('returns 0 for online/missing statuses', () => {
      expect(getStatusSeverity(TopologyItemStatus.Online)).toBe(0);
      expect(getStatusSeverity(undefined)).toBe(0);
    });
  });

  describe('getStatusThemeClass', () => {
    it('returns red for faulted/unavail and yellow for degraded/offline/removed', () => {
      expect(getStatusThemeClass(TopologyItemStatus.Faulted)).toBe('fn-theme-red');
      expect(getStatusThemeClass(TopologyItemStatus.Unavail)).toBe('fn-theme-red');
      expect(getStatusThemeClass(TopologyItemStatus.Degraded)).toBe('fn-theme-yellow');
      expect(getStatusThemeClass(TopologyItemStatus.Offline)).toBe('fn-theme-yellow');
      expect(getStatusThemeClass(TopologyItemStatus.Removed)).toBe('fn-theme-yellow');
    });

    it('returns empty string for online/missing statuses', () => {
      expect(getStatusThemeClass(TopologyItemStatus.Online)).toBe('');
      expect(getStatusThemeClass(undefined)).toBe('');
    });
  });

  describe('worstDescendantStatus', () => {
    it('returns the highest-severity status found in any descendant', () => {
      const vdev = makeRaidz(TopologyItemStatus.Online, [
        makeDisk(TopologyItemStatus.Online),
        makeDisk(TopologyItemStatus.Degraded),
        makeDisk(TopologyItemStatus.Faulted),
      ]);

      expect(worstDescendantStatus(vdev)).toBe(TopologyItemStatus.Faulted);
    });

    it('walks nested children', () => {
      const inner = makeRaidz(TopologyItemStatus.Online, [
        makeDisk(TopologyItemStatus.Unavail),
      ]);
      const outer = makeRaidz(TopologyItemStatus.Online, [inner]);

      expect(worstDescendantStatus(outer)).toBe(TopologyItemStatus.Unavail);
    });

    it('returns undefined when no children carry a severity-bearing status', () => {
      const vdev = makeRaidz(TopologyItemStatus.Online, [
        makeDisk(TopologyItemStatus.Online),
      ]);

      expect(worstDescendantStatus(vdev)).toBeUndefined();
    });
  });

  describe('getEffectiveStatus', () => {
    it('prefers a worse child status over a healthier parent status', () => {
      const vdev = makeRaidz(TopologyItemStatus.Online, [
        makeDisk(TopologyItemStatus.Faulted),
      ]);

      expect(getEffectiveStatus(vdev)).toBe(TopologyItemStatus.Faulted);
    });

    it('keeps the parent status when it is already worse than any child', () => {
      const vdev = makeRaidz(TopologyItemStatus.Faulted, [
        makeDisk(TopologyItemStatus.Degraded),
      ]);

      expect(getEffectiveStatus(vdev)).toBe(TopologyItemStatus.Faulted);
    });

    it('returns the parent status when no children are worse', () => {
      const vdev = makeRaidz(TopologyItemStatus.Online, [
        makeDisk(TopologyItemStatus.Online),
      ]);

      expect(getEffectiveStatus(vdev)).toBe(TopologyItemStatus.Online);
    });
  });
});

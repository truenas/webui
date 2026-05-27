import { NO_ERRORS_SCHEMA } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { TopologyDisk, VDev } from 'app/interfaces/storage.interface';
import { TopologyItemIconComponent } from 'app/pages/storage/modules/vdevs/components/topology-item-icon/topology-item-icon.component';
import { TopologyItemNodeComponent } from 'app/pages/storage/modules/vdevs/components/topology-item-node/topology-item-node.component';

describe('TopologyItemNodeComponent', () => {
  let spectator: Spectator<TopologyItemNodeComponent>;
  const topologyDisk = {
    type: TopologyItemType.Disk,
    path: '/path/to/disk',
    guid: '123',
    status: TopologyItemStatus.Offline,
    stats: {
      read_errors: 1,
      write_errors: 2,
      checksum_errors: 3,
    },
    children: [] as TopologyDisk[],
    disk: 'sdf',
  } as TopologyDisk;
  const disk = {
    type: DiskType.Hdd,
    size: 16 * MiB,
  } as Disk;
  // NO_ERRORS_SCHEMA: MockComponent(TnIconComponent) crashes because ng-mocks tries
  // to mirror TnIconComponent's signal-based view queries. The schema renders <tn-icon>
  // as an unknown element so our attribute-only assertions still work.
  const createComponent = createComponentFactory({
    component: TopologyItemNodeComponent,
    declarations: [
      MockComponent(TopologyItemIconComponent),
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { disk, topologyItem: topologyDisk },
    });
  });

  it('shows "VDEV Name"', () => {
    expect(spectator.query('.name')).toHaveText(topologyDisk.disk);
    expect(spectator.query(TopologyItemIconComponent)!.disk).toBe(disk);
    expect(spectator.query(TopologyItemIconComponent)!.topologyItem).toBe(topologyDisk);
  });

  it('shows "Status"', () => {
    expect(spectator.query('.cell-status span')).toHaveText(topologyDisk.status);
    expect(spectator.query('.cell-status')).toHaveClass('fn-theme-yellow');
  });

  // The status cell color must follow the same severity model as the descendant warning icon.
  // UNAVAIL is critical (red) — previously it was not flagged at all.
  const statusColorTable: { status: TopologyItemStatus; expectedClass: string }[] = [
    { status: TopologyItemStatus.Faulted, expectedClass: 'fn-theme-red' },
    { status: TopologyItemStatus.Unavail, expectedClass: 'fn-theme-red' },
    { status: TopologyItemStatus.Degraded, expectedClass: 'fn-theme-yellow' },
    { status: TopologyItemStatus.Offline, expectedClass: 'fn-theme-yellow' },
    { status: TopologyItemStatus.Removed, expectedClass: 'fn-theme-yellow' },
  ];

  statusColorTable.forEach(({ status, expectedClass }) => {
    it(`colors the status cell ${expectedClass} when status is ${status}`, () => {
      spectator.setInput('topologyItem', { ...topologyDisk, status });
      expect(spectator.query('.cell-status')).toHaveClass(expectedClass);
    });
  });

  // Optimal statuses leave the cell uncolored.
  [TopologyItemStatus.Online, TopologyItemStatus.Inuse].forEach((status) => {
    it(`leaves the status cell uncolored when status is ${status}`, () => {
      spectator.setInput('topologyItem', { ...topologyDisk, status });
      expect(spectator.query('.cell-status')).not.toHaveClass('fn-theme-red');
      expect(spectator.query('.cell-status')).not.toHaveClass('fn-theme-yellow');
    });
  });

  it('shows "Capacity"', () => {
    expect(spectator.query('.cell-capacity')).toHaveText('16 MiB');
  });

  it('shows "Errors" when count > 0', () => {
    expect(spectator.query('.cell-errors')).toHaveText('6 Errors');
  });

  it('shows "No errors" when count is zero', () => {
    spectator.setInput('topologyItem', {
      ...topologyDisk,
      stats: {
        ...topologyDisk.stats,
        read_errors: 0,
        write_errors: 0,
        checksum_errors: 0,
      },
    });
    expect(spectator.query('.cell-errors')).toHaveText('No errors');
  });

  describe('descendant warning icon', () => {
    const child = (status: TopologyItemStatus): TopologyDisk => ({
      type: TopologyItemType.Disk,
      status,
      children: [] as TopologyDisk[],
    } as TopologyDisk);

    const onlineChild = child(TopologyItemStatus.Online);

    const buildVdev = (children: TopologyDisk[]): VDev => ({
      type: TopologyItemType.Raidz3,
      status: TopologyItemStatus.Degraded,
      children,
    } as VDev);

    it('hides the warning icon when no descendant is broken (own status irrelevant)', () => {
      spectator.setInput('topologyItem', buildVdev([onlineChild, onlineChild]));
      expect(spectator.query('.descendant-warning-icon')).toBeNull();
    });

    it('hides the warning icon for leaf disks (no children)', () => {
      // Leaf disks don't need a descendant warning — their own row already shows their status.
      expect(spectator.query('.descendant-warning-icon')).toBeNull();
    });

    // Locks in the severity table: critical (red) for FAULTED/UNAVAIL, warning (yellow) for
    // DEGRADED/OFFLINE/REMOVED. If anyone touches statusSeverity these will catch the drift.
    const severityTable: { status: TopologyItemStatus; expectedClass: string }[] = [
      { status: TopologyItemStatus.Faulted, expectedClass: 'severity-critical' },
      { status: TopologyItemStatus.Unavail, expectedClass: 'severity-critical' },
      { status: TopologyItemStatus.Degraded, expectedClass: 'severity-warning' },
      { status: TopologyItemStatus.Offline, expectedClass: 'severity-warning' },
      { status: TopologyItemStatus.Removed, expectedClass: 'severity-warning' },
    ];

    severityTable.forEach(({ status, expectedClass }) => {
      it(`renders a ${expectedClass} icon when a descendant is ${status}`, () => {
        spectator.setInput('topologyItem', buildVdev([onlineChild, child(status)]));
        const icon = spectator.query('.descendant-warning-icon');
        expect(icon).not.toBeNull();
        expect(icon).toHaveClass(expectedClass);
        const otherClass = expectedClass === 'severity-critical' ? 'severity-warning' : 'severity-critical';
        expect(icon).not.toHaveClass(otherClass);
      });
    });

    it('escalates to critical when a mixed set of children contains FAULTED', () => {
      spectator.setInput('topologyItem', buildVdev([
        child(TopologyItemStatus.Degraded),
        child(TopologyItemStatus.Faulted),
        child(TopologyItemStatus.Offline),
      ]));
      expect(spectator.query('.descendant-warning-icon')).toHaveClass('severity-critical');
    });

    it('recurses through nested topology and surfaces a deeper FAULTED leaf', () => {
      const nestedMirror = {
        type: TopologyItemType.Mirror,
        status: TopologyItemStatus.Degraded,
        children: [onlineChild, child(TopologyItemStatus.Faulted)],
      } as VDev;
      spectator.setInput('topologyItem', buildVdev([nestedMirror, onlineChild]));
      const icon = spectator.query('.descendant-warning-icon');
      expect(icon).toHaveClass('severity-critical');
      const aria = icon!.getAttribute('aria-label')!;
      expect(aria).toContain('2 disks');
      expect(aria).toContain(TopologyItemStatus.Faulted);
    });

    it('does not change the parent status text/badge — that stays as reported by the API', () => {
      // The parent VDEV's own status (e.g. DEGRADED) must keep showing in the status cell.
      // The icon is a separate scannability hint and never modifies what zpool reports.
      spectator.setInput('topologyItem', buildVdev([onlineChild, child(TopologyItemStatus.Unavail)]));
      expect(spectator.query('.cell-status span')).toHaveText(TopologyItemStatus.Degraded);
      expect(spectator.query('.cell-status')).toHaveClass('fn-theme-yellow');
    });

    it('exposes count + worst status in the tooltip and aria-label (single)', () => {
      spectator.setInput('topologyItem', buildVdev([onlineChild, child(TopologyItemStatus.Faulted)]));
      const icon = spectator.query('.descendant-warning-icon');
      const aria = icon!.getAttribute('aria-label')!;
      expect(aria).toContain('1 disk');
      expect(aria).toContain(TopologyItemStatus.Faulted);
      expect(icon!.getAttribute('role')).toBe('img');
    });

    it('pluralizes the tooltip when multiple descendants are non-optimal and still names the worst', () => {
      spectator.setInput('topologyItem', buildVdev([
        child(TopologyItemStatus.Degraded),
        child(TopologyItemStatus.Offline),
        child(TopologyItemStatus.Faulted),
      ]));
      const icon = spectator.query('.descendant-warning-icon');
      const aria = icon!.getAttribute('aria-label')!;
      expect(aria).toContain('3 disks');
      expect(aria).toContain('non-optimal');
      expect(aria).toContain(TopologyItemStatus.Faulted);
    });
  });
});

import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { GaugeChartComponent } from 'app/modules/charts/gauge-chart/gauge-chart.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ThemeService } from 'app/modules/theme/theme.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import { PoolUsageCardComponent } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/pool-usage-card.component';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';

describe('PoolUsageCardComponent', () => {
  let spectator: Spectator<PoolUsageCardComponent>;
  const tierEnabled = signal(false);
  const metadataReservePct = signal(0);

  const createComponent = createComponentFactory({
    component: PoolUsageCardComponent,
    imports: [
      ReactiveFormsModule,
      FileSizePipe,
      MockComponent(GaugeChartComponent),
    ],
    declarations: [
      MockComponent(PoolCardIconComponent),
    ],
    providers: [
      ThemeService,
      mockProvider(SharingTierService, {
        tierEnabled,
        metadataReservePct,
        getTierConfig: () => of({
          enabled: tierEnabled(),
          special_class_metadata_reserve_pct: metadataReservePct(),
        }),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferencesState,
            value: {
              areLoaded: true,
              preferences: { userTheme: 'ix-dark' },
              previewTheme: null,
            },
          },
        ],
      }),
      mockWindow({
        sessionStorage: {
          getItem: () => 'ix-dark',
          setItem: () => jest.fn(),
        },
        localStorage: {
          getItem: jest.fn(),
          setItem: jest.fn(),
        },
        matchMedia: () => ({
          matches: false,
          addEventListener: jest.fn(),
        }),
      }),
    ],
  });

  beforeEach(() => {
    tierEnabled.set(false);
    metadataReservePct.set(0);
    spectator = createComponent({
      props: {
        poolState: {
          healthy: true,
          name: 'bingo',
          status: 'ONLINE',
          used: 3384541603,
          available: 899688274,

          topology: {
            data: [{
              disk: 'sda',
              type: TopologyItemType.Disk,
            }, {
              disk: 'sdb',
              type: TopologyItemType.Disk,
            }],
          },
        } as Pool,
      },
    });
  });

  it('renders component properties when usage is below 80%', () => {
    expect(spectator.query('.capacity-caption')).toHaveText('Usable Capacity: 3.99 GiB');
    expect(spectator.query('.used-caption')).toHaveText('Used: 3.15 GiB');
    expect(spectator.query('.available-caption')).toHaveText('Available: 858.01 MiB');
    expect(spectator.query('.warning-container')).not.toBeVisible();
    expect(spectator.query(GaugeChartComponent)!.label).toBe('79%');
    expect(spectator.query(GaugeChartComponent)!.value).toBeCloseTo(79, 0);
    expect(spectator.query(GaugeChartComponent)!.colorFill).toBe('var(--blue)');
  });

  it('renders component values when usage is above 80%', () => {
    spectator.setInput('poolState', {
      healthy: true,
      name: 'bingo',
      status: 'ONLINE',
      used: 2199792913690,
      available: 516000806915,

      topology: {
        data: [{
          disk: 'sda',
          type: TopologyItemType.Disk,
        }],
      },
    } as Pool);

    expect(spectator.query('.capacity-caption')).toHaveText('Usable Capacity: 2.47 TiB');
    expect(spectator.query('.used-caption')).toHaveText('Used: 2 TiB');
    expect(spectator.query('.available-caption')).toHaveText('Available: 480.56 GiB');
    expect(spectator.query('.warning-container')).toBeVisible();
    expect(spectator.query('.warning-container')).toHaveText('Warning: Low Capacity');
    expect(spectator.query(GaugeChartComponent)!.label).toBe('81%');
    expect(spectator.query(GaugeChartComponent)!.value).toBeCloseTo(81, 0);
    expect(spectator.query(GaugeChartComponent)!.colorFill).toBe('#CE2929');
  });

  it('renders status icon', () => {
    expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Safe);
    expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe('Everything is fine');

    spectator.setInput('poolState', {
      healthy: true,
      name: 'bingo',
      status: 'ONLINE',
      used: 2199792913690,
      available: 516000806915,

      topology: {
        data: [{
          disk: 'sda',
          type: TopologyItemType.Disk,
        }],
      },
    } as Pool);

    expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Warn);
    expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe('Pool is using more than 80% of available space');
  });

  it('should pre-select disks when user click "View Disk Reports" link', () => {
    const href = spectator.query(byText('View Disk Reports'))!.getAttribute('href');
    expect(href).toBe('/reportsdashboard/disk?disks=sda&disks=sdb');
  });

  it('should pre-select datasets when user click "View Datasets" link', () => {
    const link = spectator.query('mat-card-header a');
    expect(link).toHaveText('View Datasets');
    expect(link).toHaveAttribute('href', '/datasets/bingo');
  });

  it('does not show tier breakdown when tiering is disabled', () => {
    expect(spectator.query('.tier-breakdown')).not.toExist();
  });

  it('does not show tier breakdown when tiering is enabled but no special vdev', () => {
    tierEnabled.set(true);
    spectator.detectChanges();

    expect(spectator.query('.tier-breakdown')).not.toExist();
  });

  it('shows tier breakdown when tiering is enabled and pool has special vdev', () => {
    tierEnabled.set(true);
    // usable 2 GiB, reserve 25% => 512 MiB reserved; display available =
    // raw available (1.5 GiB) - reserve (512 MiB) = 1 GiB.
    metadataReservePct.set(25);

    spectator.setInput('poolState', {
      healthy: true,
      name: 'bingo',
      status: 'ONLINE',
      used: 3384541603,
      available: 2510301010,
      special_class_used: 536870912,
      special_class_available: 1610612736,
      special_class_usable: 2147483648,
      topology: {
        data: [{
          disk: 'sda',
          type: TopologyItemType.Disk,
        }],
        special: [{
          disk: 'nvme0',
          type: TopologyItemType.Disk,
        }],
      },
    } as Pool);

    spectator.component.ngOnInit();
    spectator.detectChanges();

    expect(spectator.query('.list-caption')).not.toExist();

    const tierBreakdown = spectator.query('.tier-breakdown');
    expect(tierBreakdown).toExist();

    const tierRows = spectator.queryAll('.tier-row');
    expect(tierRows).toHaveLength(2);

    const performanceStatItems = tierRows[0].querySelectorAll('.stat-item');
    expect(performanceStatItems).toHaveLength(3);
    expect(performanceStatItems[0]).toHaveText('512 MiB Used');
    expect(performanceStatItems[1]).toHaveText('1 GiB Available');
    expect(performanceStatItems[2]).toHaveText('512 MiB Reserved');

    const regularStatItems = tierRows[1].querySelectorAll('.stat-item');
    expect(regularStatItems).toHaveLength(2);
    expect(regularStatItems[0]).toHaveText('3.15 GiB Used');
    expect(regularStatItems[1]).toHaveText('2.34 GiB Available');
  });

  it('shows used eating into the reserve when usage crosses the threshold', () => {
    tierEnabled.set(true);
    // usable 2 GiB, reserve 25% => threshold at 1.5 GiB. Used is 1.75 GiB, so it
    // has crossed 0.25 GiB (12.5% of usable) into the reserve.
    metadataReservePct.set(25);

    spectator.setInput('poolState', {
      healthy: true,
      name: 'bingo',
      status: 'ONLINE',
      used: 3384541603,
      available: 2510301010,
      special_class_used: 1879048192,
      special_class_available: 268435456,
      special_class_usable: 2147483648,
      topology: {
        data: [{
          disk: 'sda',
          type: TopologyItemType.Disk,
        }],
        special: [{
          disk: 'nvme0',
          type: TopologyItemType.Disk,
        }],
      },
    } as Pool);

    spectator.component.ngOnInit();
    spectator.detectChanges();

    // Reserve zone is a fixed-width striped overlay (25% of usable). The Used bar
    // runs past the 75% threshold to 87.5%, so it slides under the reserve zone —
    // that overlap is the usage eating into the reserve.
    const reserveZone = spectator.query('.reserve-zone');
    expect(reserveZone).toExist();
    expect(reserveZone!.getAttribute('style')).toContain('width: 25%');

    const usedBar = spectator.query('.performance-used');
    expect(usedBar!.getAttribute('style')).toContain('width: 87.5%');

    const performanceStatItems = spectator.queryAll('.tier-row')[0].querySelectorAll('.stat-item');
    expect(performanceStatItems[0]).toHaveText('1.75 GiB Used');
    expect(performanceStatItems[1]).toHaveText('0 B Available');
    expect(performanceStatItems[2]).toHaveText('512 MiB Reserved');
  });
});

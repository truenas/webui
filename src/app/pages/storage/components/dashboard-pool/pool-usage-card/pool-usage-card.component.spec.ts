import { ReactiveFormsModule } from '@angular/forms';
import { byText, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import { GaugeChartComponent } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/gauge-chart/gauge-chart.component';
import { PoolUsageCardComponent } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/pool-usage-card.component';
import { ThemeService } from 'app/services/theme/theme.service';
import { selectTheme } from 'app/store/preferences/preferences.selectors';

describe('PoolUsageCardComponent', () => {
  let spectator: Spectator<PoolUsageCardComponent>;
  const createComponent = createComponentFactory({
    component: PoolUsageCardComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(GaugeChartComponent),
      MockComponent(PoolCardIconComponent),
    ],
    providers: [
      ThemeService,
      provideMockStore({
        selectors: [
          { selector: selectTheme, value: 'ix-dark' },
        ],
      }),
      mockWindow({
        sessionStorage: {
          getItem: () => 'ix-dark',
          setItem: () => {},
        },
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        poolState: {
          healthy: true,
          status: 'ONLINE',
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
        rootDataset: {
          used: {
            parsed: 3384541603,
          },
          available: {
            parsed: 899688274,
          },
        } as Dataset,
      },
    });
  });

  it('renders component properties when usage is below 80%', () => {
    expect(spectator.query('.capacity-caption')).toHaveText('Usable Capacity: 3.99 GiB');
    expect(spectator.query('.used-caption')).toHaveText('Used: 3.15 GiB');
    expect(spectator.query('.available-caption')).toHaveText('Available: 858.01 MiB');
    expect(spectator.query('.warning-container')).not.toBeVisible();
    expect(spectator.query(GaugeChartComponent).label).toBe('79%');
    expect(Math.round(spectator.query(GaugeChartComponent).value)).toBe(79);
    expect(spectator.query(GaugeChartComponent).colorFill).toBe('var(--blue)');
  });

  it('renders component values when usage is above 80%', () => {
    spectator.setInput('rootDataset', {
      used: {
        parsed: 2199792913690,
      },
      available: {
        parsed: 516000806915,
      },
    } as Dataset);

    expect(spectator.query('.capacity-caption')).toHaveText('Usable Capacity: 2.47 TiB');
    expect(spectator.query('.used-caption')).toHaveText('Used: 2 TiB');
    expect(spectator.query('.available-caption')).toHaveText('Available: 480.56 GiB');
    expect(spectator.query('.warning-container')).toBeVisible();
    expect(spectator.query('.warning-container')).toHaveText('Warning: Low Capacity');
    expect(spectator.query(GaugeChartComponent).label).toBe('81%');
    expect(Math.round(spectator.query(GaugeChartComponent).value)).toBe(81);
    expect(spectator.query(GaugeChartComponent).colorFill).toBe('#CE2929');
  });

  it('renders status icon', () => {
    expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Safe);
    expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Everything is fine');

    spectator.setInput('rootDataset', {
      used: {
        parsed: 2199792913690,
      },
      available: {
        parsed: 516000806915,
      },
    } as Dataset);

    expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Warn);
    expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Pool is using more than 80% of available space');
  });

  it('should pre-select disks when user click "View Disk Space Reports" link', () => {
    const href = spectator.query(byText('View Disk Space Reports')).getAttribute('href');
    expect(href).toBe('/reportsdashboard/disk?disks=sda&disks=sdb');
  });
});

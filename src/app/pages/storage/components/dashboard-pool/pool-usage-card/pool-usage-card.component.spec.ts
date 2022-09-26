import { ReactiveFormsModule } from '@angular/forms';
import { byText, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { GaugeChartComponent } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/gauge-chart/gauge-chart.component';
import { PoolUsageCardComponent } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/pool-usage-card.component';

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
        } as unknown as Pool,
        rootDataset: {
          used: {
            parsed: 3384541603,
          },
          available: {
            parsed: 899688274,
          },
          usedbysnapshots: {
            parsed: 120000,
          },
        } as Dataset,
      },
    });
  });

  it('renders component properties when usage is below 80%', () => {
    expect(spectator.query('.capacity-caption')).toHaveText('Usable Capacity: 3.99 GiB');
    expect(spectator.query('.used-caption')).toHaveText('Used: 3.15 GiB');
    expect(spectator.query('.available-caption')).toHaveText('Available: 858.01 MiB');
    expect(spectator.query('.snapshots-caption')).toHaveText('Used by Snapshots: 117.19 KiB');
    expect(spectator.query('.warning-container')).not.toBeVisible();
    expect(spectator.query('mat-card-header mat-icon')).toHaveText('check_circle');
    expect(spectator.query(GaugeChartComponent).label).toBe('79%');
    expect(Math.round(spectator.query(GaugeChartComponent).value)).toBe(79);
    expect(spectator.query(GaugeChartComponent).colorFill).toBe('#0095D5');
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
    expect(spectator.query('.snapshots-caption')).toHaveText('Used by Snapshots: 0 B');
    expect(spectator.query('.warning-container')).toBeVisible();
    expect(spectator.query('.warning-container')).toHaveText('Warning: Low Capacity');
    expect(spectator.query(GaugeChartComponent).label).toBe('81%');
    expect(Math.round(spectator.query(GaugeChartComponent).value)).toBe(81);
    expect(spectator.query(GaugeChartComponent).colorFill).toBe('#CE2929');
  });

  it('renders status icon', () => {
    expect(spectator.query('mat-card-header mat-icon')).toHaveText('check_circle');

    spectator.setInput('poolState', { healthy: false, status: 'ONLINE' } as unknown as Pool);
    expect(spectator.query('mat-card-header mat-icon')).toHaveText('warning');

    spectator.setInput('poolState', { healthy: true, status: 'OFFLINE' } as unknown as Pool);
    expect(spectator.query('mat-card-header mat-icon')).toHaveText('warning');

    spectator.setInput('poolState', { healthy: true, status: 'REMOVED' } as unknown as Pool);
    expect(spectator.query('mat-card-header mat-icon')).toHaveText('cancel');

    spectator.setInput('poolState', { healthy: true, status: 'FAULTED' } as unknown as Pool);
    expect(spectator.query('mat-card-header mat-icon')).toHaveText('cancel');
  });

  it('should pre-select disks when user click "View Disk Space Reports" link', () => {
    const href = spectator.query(byText('View Disk Space Reports')).getAttribute('href');
    expect(href).toBe('/reportsdashboard/disk?disks=sda&disks=sdb');
  });
});

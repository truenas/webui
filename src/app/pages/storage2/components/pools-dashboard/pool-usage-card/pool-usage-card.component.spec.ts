import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Pool } from 'app/interfaces/pool.interface';
import { VolumeData } from 'app/interfaces/volume-data.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { GaugeChartComponent } from 'app/pages/storage2/components/pools-dashboard/pool-usage-card/gauge-chart/gauge-chart.component';
import { PoolUsageCardComponent } from 'app/pages/storage2/components/pools-dashboard/pool-usage-card/pool-usage-card.component';

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
        loading: false,
        poolState: {
          healthy: true,
          status: 'ONLINE',
        } as unknown as Pool,
        volumeData: {
          avail: 162570240,
          id: 'My Pool',
          name: 'My Pool',
          used: 2656002048,
          used_pct: '79%',
        } as VolumeData,
      },
    });
  });

  it('rendering component when usage is below 80%', () => {
    expect(spectator.query('.capacity-caption')).toHaveText('Usable Capacity:2.63 GiB');
    expect(spectator.query('.used-caption')).toHaveText('Used:2.47 GiB');
    expect(spectator.query('.available-caption')).toHaveText('Available:155.04 MiB');
    expect(spectator.query('.snapshots-caption')).toHaveText('Used by Snapshots:Unknown');
    expect(spectator.query('.warning-container')).not.toBeVisible();
    expect(spectator.query('.healthy mat-icon')).toHaveText('check_circle');
    expect(spectator.query(GaugeChartComponent).label).toBe('79%');
    expect(spectator.query(GaugeChartComponent).value).toBe(79);
    expect(spectator.query(GaugeChartComponent).colorFill).toBe('#0095D5');
  });

  it('rendering component when usage is above 80%', () => {
    spectator.setInput('volumeData', {
      avail: 1331775406080,
      id: 'My Pool',
      name: 'My Pool',
      used: 1024,
      used_pct: '81%',
    } as VolumeData);

    expect(spectator.query('.capacity-caption')).toHaveText('Usable Capacity:1.21 TiB');
    expect(spectator.query('.used-caption')).toHaveText('Used:1.00 KiB');
    expect(spectator.query('.available-caption')).toHaveText('Available:1.21 TiB');
    expect(spectator.query('.snapshots-caption')).toHaveText('Used by Snapshots:Unknown');
    expect(spectator.query('.warning-container')).toBeVisible();
    expect(spectator.query('.warning-container')).toHaveText('Warning: Low Capacity');
    expect(spectator.query('.warning mat-icon')).toHaveText('warning');
    expect(spectator.query(GaugeChartComponent).label).toBe('81%');
    expect(spectator.query(GaugeChartComponent).value).toBe(81);
    expect(spectator.query(GaugeChartComponent).colorFill).toBe('red');
  });

  it('rendering component with different "poolState"', () => {
    expect(spectator.query('.healthy mat-icon')).toHaveText('check_circle');

    spectator.setInput('poolState', { healthy: false, status: 'ONLINE' } as unknown as Pool);
    expect(spectator.query('.warning mat-icon')).toHaveText('warning');

    spectator.setInput('poolState', { healthy: true, status: 'OFFLINE' } as unknown as Pool);
    expect(spectator.query('.warning mat-icon')).toHaveText('warning');

    spectator.setInput('poolState', { healthy: true, status: 'REMOVED' } as unknown as Pool);
    expect(spectator.query('.error mat-icon')).toHaveText('cancel');

    spectator.setInput('poolState', { healthy: true, status: 'FAULTED' } as unknown as Pool);
    expect(spectator.query('.error mat-icon')).toHaveText('cancel');
  });

  it('rendering component when change "loading"', () => {
    spectator.setInput('loading', true);
    expect(spectator.queryAll('.value-caption').length).toEqual(0);
    expect(spectator.queryAll(GaugeChartComponent).length).toEqual(0);
    expect(spectator.queryAll('mat-toolbar-row mat-icon').length).toEqual(0);
    spectator.setInput('loading', false);
    expect(spectator.queryAll('.value-caption').length).toEqual(4);
    expect(spectator.queryAll(GaugeChartComponent).length).toEqual(1);
    expect(spectator.queryAll('mat-toolbar-row mat-icon').length).toEqual(1);
  });
});

import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { WidgetTopologyComponent } from 'app/pages/storage2/components/pools-dashboard/widget-topology/widget-topology.component';

describe('WidgetTopologyComponent', () => {
  let spectator: Spectator<WidgetTopologyComponent>;

  const createComponent = createComponentFactory({
    component: WidgetTopologyComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        loading: false,
        poolState: {
          id: 1,
          name: 'test pool',
          healthy: true,
          status: 'ONLINE',
          topology: {
            data: [
              {
                type: 'RAIDZ1',
                children: [{ type: 'DISK', disk: 'sda' }, { type: 'DISK', disk: 'sdb' }, { type: 'DISK', disk: 'sdc' }],
              },
              {
                type: 'RAIDZ1',
                children: [{ type: 'DISK', disk: 'sdd' }, { type: 'DISK', disk: 'sde' }],
              },
            ],
            log: [
              {
                type: 'MIRROR',
                children: [{ type: 'DISK', disk: 'sdf' }, { type: 'DISK', disk: 'sdg' }],
              },
            ],
            cache: [
              { type: 'DISK', disk: 'sdh', children: [] },
              { type: 'DISK', disk: 'sdi', children: [] },
            ],
            spare: [
              { type: 'DISK', disk: 'sdj', children: [] },
              { type: 'DISK', disk: 'sdk', children: [] },
            ],
            special: [
              {
                type: 'MIRROR',
                children: [{ type: 'DISK', disk: 'sdl' }, { type: 'DISK', disk: 'sdm' }],
              },
            ],
            dedup: [],
          },
        } as unknown as Pool,
        diskDictionary: {
          sda: { size: 1073741824 * 2 },
          sdb: { size: 1073741824 * 2 },
          sdc: { size: 1073741824 * 2 },
          sdd: { size: 1073741824 * 2 },
          sde: { size: 1073741824 * 2 },
          sdf: { size: 1048576 * 5 },
          sdg: { size: 1048576 * 5 },
          sdh: { size: 1048576 * 6 },
          sdi: { size: 1048576 * 6 },
          sdj: { size: 1048576 * 4 },
          sdk: { size: 1048576 * 3 },
          sdl: { size: 1073741824 * 2 },
          sdm: { size: 1073741824 * 1 },
        } as unknown as { [key: string]: Disk },
      },
    });
  });

  it('rendering VDEVs rows', () => {
    const captions = spectator.queryAll('.vdev-line b');
    const values = spectator.queryAll('.vdev-line .vdev-value');
    expect(spectator.queryAll('.vdev-line .warning mat-icon').length).toEqual(2);
    expect(captions.length).toEqual(6);
    expect(values.length).toEqual(6);

    expect(captions[0]).toHaveText('Data VDEVs');
    expect(values[0]).toHaveText('2 x RAIDZ1 | 5 wide | 2.00GiB');
    expect(captions[1]).toHaveText('Metadata');
    expect(values[1]).toHaveText('Mixed Capacity VDEVs');
    expect(captions[2]).toHaveText('Log VDEVs');
    expect(values[2]).toHaveText('1 x MIRROR | 2 wide | 5.00MiB');
    expect(captions[3]).toHaveText('Cache VDEVs');
    expect(values[3]).toHaveText('2 x 6.00MiB');
    expect(captions[4]).toHaveText('Spare VDEVs');
    expect(values[4]).toHaveText('Mixed Capacity VDEVs');
    expect(captions[5]).toHaveText('Dedup VDEVs');
    expect(values[5]).toHaveText('VDEVs are missing');
  });

  it('rendering status icon', () => {
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

  it('rendering component when change "loading"', () => {
    spectator.setInput('loading', true);
    expect(spectator.queryAll('.vdev-value').length).toEqual(0);
    expect(spectator.queryAll('mat-card-header mat-icon').length).toEqual(0);
    spectator.setInput('loading', false);
    expect(spectator.queryAll('.vdev-value').length).toEqual(6);
    expect(spectator.queryAll('mat-card-header mat-icon').length).toEqual(1);
  });
});

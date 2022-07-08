import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { Pool } from 'app/interfaces/pool.interface';
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
                stats: { bytes: [0, 73728, 4694016, 0, 0, 0, 0] },
                children: [
                  {
                    type: 'DISK',
                    stats: { bytes: [0, 24576, 1564672, 0, 0, 0, 0] },
                  },
                  {
                    type: 'DISK',
                    stats: { bytes: [0, 24576, 1564672, 0, 0, 0, 0] },
                  },
                  {
                    type: 'DISK',
                    stats: { bytes: [0, 24576, 1564672, 0, 0, 0, 0] },
                  },
                ],
              },
              {
                type: 'RAIDZ1',
                stats: { bytes: [0, 73728, 3031040, 0, 0, 0, 0] },
                children: [
                  {
                    type: 'DISK',
                    stats: { bytes: [0, 24576, 1564672, 0, 0, 0, 0] },
                  },
                  {
                    type: 'DISK',
                    stats: { bytes: [0, 24576, 1564672, 0, 0, 0, 0] },
                  },
                ],
              },
            ],
            log: [
              {
                type: 'MIRROR',
                stats: { bytes: [0, 49152, 3031040, 0, 0, 0, 0] },
                children: [
                  {
                    type: 'DISK',
                    stats: { bytes: [0, 24576, 1515520, 0, 0, 0, 0] },
                  },
                  {
                    type: 'DISK',
                    stats: { bytes: [0, 24576, 1515520, 0, 0, 0, 0] },
                  },
                ],
              },
            ],
            cache: [
              {
                type: 'DISK',
                stats: { bytes: [0, 483328, 28672, 0, 0, 0, 0] },
                children: [],
              },
              {
                type: 'DISK',
                stats: { bytes: [0, 483328, 28672, 0, 0, 0, 0] },
                children: [],
              },
            ],
            spare: [
              {
                type: 'DISK',
                stats: { bytes: [0, 483328, 28672, 0, 0, 0, 0] },
                children: [],
              },
              {
                type: 'DISK',
                stats: { bytes: [0, 483328, 14336, 0, 0, 0, 0] },
                children: [],
              },
            ],
            special: [
              {
                type: 'MIRROR',
                stats: { bytes: [0, 49152, 6250496, 0, 0, 0, 0] },
                children: [
                  {
                    type: 'DISK',
                    stats: { bytes: [0, 24576, 3125248, 0, 0, 0, 0] },
                  },
                  {
                    type: 'DISK',
                    stats: { bytes: [0, 24576, 1562624, 0, 0, 0, 0] },
                  },
                ],
              },
            ],
            dedup: [],
          },
        } as unknown as Pool,
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
    expect(values[0]).toHaveText('2 x RAIDZ1 | 5 wide | 1.49MiB');
    expect(captions[1]).toHaveText('Metadata');
    expect(values[1]).toHaveText('Mixed Capacity VDEVs');
    expect(captions[2]).toHaveText('Log VDEVs');
    expect(values[2]).toHaveText('1 x MIRROR | 2 wide | 1.45MiB');
    expect(captions[3]).toHaveText('Cache VDEVs');
    expect(values[3]).toHaveText('2 x 28.00KiB');
    expect(captions[4]).toHaveText('Spare VDEVs');
    expect(values[4]).toHaveText('Mixed Capacity VDEVs');
    expect(captions[5]).toHaveText('Dedup VDEVs');
    expect(values[5]).toHaveText('VDEVs are missing');
  });

  it('rendering status icon', () => {
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
    expect(spectator.queryAll('.vdev-value').length).toEqual(0);
    expect(spectator.queryAll('mat-toolbar-row mat-icon').length).toEqual(0);
    spectator.setInput('loading', false);
    expect(spectator.queryAll('.vdev-value').length).toEqual(6);
    expect(spectator.queryAll('mat-toolbar-row mat-icon').length).toEqual(1);
  });
});

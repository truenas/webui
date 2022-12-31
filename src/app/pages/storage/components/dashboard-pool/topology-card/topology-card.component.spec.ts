import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { StorageDashboardDisk } from 'app/interfaces/storage.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import { TopologyCardComponent } from 'app/pages/storage/components/dashboard-pool/topology-card/topology-card.component';

describe('TopologyCardComponent', () => {
  let spectator: Spectator<TopologyCardComponent>;

  const createComponent = createComponentFactory({
    component: TopologyCardComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(PoolCardIconComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        poolState: {
          id: 1,
          name: 'test pool',
          healthy: true,
          status: 'ONLINE',
          topology: {
            data: [
              {
                type: CreateVdevLayout.Raidz1,
                children: [
                  { type: 'DISK', disk: 'sda' },
                  { type: 'DISK', disk: 'sdb' },
                  { type: 'DISK', disk: 'sdc' },
                ],
              },
              {
                type: CreateVdevLayout.Raidz1,
                children: [
                  { type: 'DISK', disk: 'sdd' },
                  { type: 'DISK', disk: 'sde' },
                  { type: 'DISK', disk: 'sdf' },
                ],
              },
            ],
            log: [
              {
                type: CreateVdevLayout.Mirror,
                children: [
                  { type: 'DISK', disk: 'sdg' },
                  { type: 'DISK', disk: 'sdh' },
                ],
              },
            ],
            cache: [
              { type: 'DISK', disk: 'sdi', children: [] },
              { type: 'DISK', disk: 'sdj', children: [] },
            ],
            spare: [
              { type: 'DISK', disk: 'sdk', children: [] },
              { type: 'DISK', disk: 'sdl', children: [] },
            ],
            special: [
              {
                type: CreateVdevLayout.Mirror,
                children: [
                  { type: 'DISK', disk: 'sdm' },
                  { type: 'DISK', disk: 'sdn' },
                ],
              },
            ],
            dedup: [],
          },
        } as unknown as Pool,
        disks: [
          { name: 'sda', devname: 'sda', size: 1073741824 * 2 },
          { name: 'sdb', devname: 'sdb', size: 1073741824 * 2 },
          { name: 'sdc', devname: 'sdc', size: 1073741824 * 2 },
          { name: 'sdd', devname: 'sdd', size: 1073741824 * 2 },
          { name: 'sde', devname: 'sde', size: 1073741824 * 2 },
          { name: 'sdf', devname: 'sdf', size: 1073741824 * 2 },
          { name: 'sdg', devname: 'sdg', size: 1048576 * 5 },
          { name: 'sdh', devname: 'sdh', size: 1048576 * 5 },
          { name: 'sdi', devname: 'sdi', size: 1048576 * 6 },
          { name: 'sdj', devname: 'sdj', size: 1048576 * 6 },
          { name: 'sdk', devname: 'sdk', size: 1048576 * 4 },
          { name: 'sdl', devname: 'sdl', size: 1048576 * 3 },
          { name: 'sdm', devname: 'sdm', size: 1073741824 * 2 },
          { name: 'sdn', devname: 'sdn', size: 1073741824 * 1 },
        ] as StorageDashboardDisk[],
      },
    });
  });

  it('rendering VDEVs rows', () => {
    const captions = spectator.queryAll('.vdev-line b');
    const values = spectator.queryAll('.vdev-line .vdev-value');
    expect(spectator.queryAll('.vdev-line .warning ix-icon')).toHaveLength(2);
    expect(captions).toHaveLength(6);
    expect(values).toHaveLength(6);

    expect(captions[0]).toHaveText('Data VDEVs');
    expect(values[0]).toHaveText('2 x RAIDZ1 | 3 wide | 2 GiB');
    expect(captions[1]).toHaveText('Metadata');
    expect(values[1]).toHaveText('Mixed Capacity VDEVs');
    expect(captions[2]).toHaveText('Log VDEVs');
    expect(values[2]).toHaveText('1 x MIRROR | 2 wide | 5 MiB');
    expect(captions[3]).toHaveText('Cache VDEVs');
    expect(values[3]).toHaveText('2 x 6 MiB');
    expect(captions[4]).toHaveText('Spare VDEVs');
    expect(values[4]).toHaveText('Mixed Capacity VDEVs');
    expect(captions[5]).toHaveText('Dedup VDEVs');
    expect(values[5]).toHaveText('VDEVs not assigned');
  });

  it('rendering status icon', () => {
    expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Safe);
    expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Everything is fine');

    spectator.setInput('poolState', { healthy: false, status: 'ONLINE' } as unknown as Pool);
    expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Warn);
    expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Pool is not healthy');

    spectator.setInput('poolState', { healthy: true, status: 'OFFLINE' } as unknown as Pool);
    expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Warn);
    expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Pool contains OFFLINE Data VDEVs');

    spectator.setInput('poolState', { healthy: true, status: 'REMOVED' } as unknown as Pool);
    expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Error);
    expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Pool contains REMOVED Data VDEVs');

    spectator.setInput('poolState', { healthy: true, status: 'FAULTED' } as unknown as Pool);
    expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Error);
    expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Pool contains FAULTED Data VDEVs');
  });
});

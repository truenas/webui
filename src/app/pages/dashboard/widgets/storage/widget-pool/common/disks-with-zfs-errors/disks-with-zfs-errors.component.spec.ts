import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Pool } from 'app/interfaces/pool.interface';
import { DisksWithZfsErrorsComponent } from './disks-with-zfs-errors.component';

describe('DisksWithZfsErrorsComponent', () => {
  let spectator: Spectator<DisksWithZfsErrorsComponent>;
  const createComponent = createComponentFactory({
    component: DisksWithZfsErrorsComponent,
    imports: [NgxSkeletonLoaderModule],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        pool: undefined,
      },
    });
  });

  it('should display skeleton loader when pool is loading', () => {
    expect(spectator.query('ngx-skeleton-loader')).toBeTruthy();
  });

  it('should display total ZFS errors when pool is loaded', () => {
    const mockPool = {
      topology: {
        data: [
          { stats: { read_errors: 1, write_errors: 2, checksum_errors: 3 } },
          { stats: { read_errors: 0, write_errors: 0, checksum_errors: 0 } },
        ],
        cache: [],
        log: [],
        spare: [],
        special: [],
      },
    } as Pool;

    spectator.setInput('pool', mockPool);

    expect(spectator.query('.value')).toHaveText('6');
    expect(spectator.query('ngx-skeleton-loader')).toBeFalsy();
  });

  it('should display label', () => {
    expect(spectator.query('.label')).toHaveText('Disks w/ZFS Errors');
  });
});

import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { PoolStatusComponent } from './pool-status.component';

describe('PoolStatusComponent', () => {
  let spectator: Spectator<PoolStatusComponent>;
  const createComponent = createComponentFactory({
    component: PoolStatusComponent,
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

  it('should display pool status when pool is loaded', () => {
    const mockPool = {
      status: PoolStatus.Online,
    } as Pool;

    spectator.setInput('pool', mockPool);

    expect(spectator.query('.value')).toHaveText(PoolStatus.Online);
    expect(spectator.query('ngx-skeleton-loader')).toBeFalsy();
  });

  it('should display label', () => {
    expect(spectator.query('.label')).toHaveText('Pool Status');
  });
});

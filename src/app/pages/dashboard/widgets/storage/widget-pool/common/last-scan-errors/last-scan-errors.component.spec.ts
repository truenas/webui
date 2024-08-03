import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Pool } from 'app/interfaces/pool.interface';
import { LastScanErrorsComponent } from './last-scan-errors.component';

describe('LastScanErrorsComponent', () => {
  let spectator: Spectator<LastScanErrorsComponent>;
  const createComponent = createComponentFactory({
    component: LastScanErrorsComponent,
    imports: [NgxSkeletonLoaderModule],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        pool: null,
      },
    });
  });

  it('should display skeleton loader when pool is loading', () => {
    expect(spectator.query('ngx-skeleton-loader')).toBeTruthy();
  });

  it('should display scan errors when pool is loaded', () => {
    const mockPool = {
      scan: {
        errors: 5,
      },
    } as Pool;

    spectator.setInput('pool', mockPool);

    expect(spectator.query('.value')).toHaveText('5');
    expect(spectator.query('ngx-skeleton-loader')).toBeFalsy();
  });

  it('should display label', () => {
    expect(spectator.query('.label')).toHaveText('Last Scan Errors');
  });
});

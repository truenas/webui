import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { AppCpuInfoComponent } from './app-cpu-info.component';

describe('AppCpuInfoComponent', () => {
  let spectator: Spectator<AppCpuInfoComponent>;
  const createComponent = createComponentFactory({
    component: AppCpuInfoComponent,
    declarations: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        stats: {
          isLoading: false,
          error: null,
          value: {
            cpu_usage: 12.34,
          },
        } as LoadingState<AppStats>,
      },
    });
  });

  it('checks value', () => {
    const value = spectator.query('h3 span');
    expect(value).toHaveText('12');
  });

  it('checks unit', () => {
    const unit = spectator.query('h3 small');
    expect(unit).toHaveText('%');
  });

  it('checks label', () => {
    const label = spectator.query('strong');
    expect(label).toHaveText('CPU Usage');
  });
});

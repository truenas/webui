import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { AppMemoryInfoComponent } from './app-memory-info.component';

describe('AppMemoryInfoComponent', () => {
  let spectator: Spectator<AppMemoryInfoComponent>;
  const createComponent = createComponentFactory({
    component: AppMemoryInfoComponent,
    declarations: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        stats: {
          isLoading: false,
          error: null,
          value: {
            memory: 123456789,
          },
        } as LoadingState<AppStats>,
      },
    });
  });

  it('checks value', () => {
    const value = spectator.query('h3 span');
    expect(value).toHaveText('118');
  });

  it('checks unit', () => {
    const unit = spectator.query('h3 small');
    expect(unit).toHaveText('MiB');
  });

  it('checks label', () => {
    const label = spectator.query('strong');
    expect(label).toHaveText('Memory Usage');
  });
});

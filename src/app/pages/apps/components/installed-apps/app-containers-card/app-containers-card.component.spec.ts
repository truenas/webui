import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppContainersCardComponent } from './app-containers-card.component';

describe('AppContainersCardComponent', () => {
  let spectator: Spectator<AppContainersCardComponent>;

  const app = {
    id: 'ix-test-app',
    update_available: true,
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppContainersCardComponent,
    declarations: [],
    providers: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app,
      },
    });
  });

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Containers');
    expect(spectator.query('mat-card-header button')).toHaveText('Shell');
  });
});

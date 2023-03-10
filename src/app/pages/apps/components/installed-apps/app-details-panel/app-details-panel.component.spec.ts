import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppDetailsPanelComponent } from './app-details-panel.component';

describe('AppDetailsPanelComponent', () => {
  let spectator: Spectator<AppDetailsPanelComponent>;

  const app = {
    id: 'ix-test-app',
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppDetailsPanelComponent,
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

  it('shows a title', () => {
    expect(spectator.query('h2')).toHaveText('Application Details');
  });
});

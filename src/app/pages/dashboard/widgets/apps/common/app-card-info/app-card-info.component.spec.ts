import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStateCellComponent } from 'app/pages/apps/components/installed-apps/app-state-cell/app-state-cell.component';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';
import { AppVersionPipe } from 'app/pages/dashboard/widgets/apps/common/utils/app-version.pipe';
import { AppCardInfoComponent } from './app-card-info.component';

describe('AppCardInfoComponent', () => {
  let spectator: Spectator<AppCardInfoComponent>;
  const createComponent = createComponentFactory({
    component: AppCardInfoComponent,
    declarations: [
      MockComponents(AppStateCellComponent, AppUpdateCellComponent),
    ],
    imports: [AppVersionPipe],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app: {
          isLoading: false,
          error: null,
          value: {
            name: 'TestApp',
            metadata: {
              app_version: 'v1.0.0',
            },
          },
        } as LoadingState<App>,
        job: {} as Job<void, AppStartQueryParams>,
      },
    });
  });

  it('checks app name', () => {
    const appName = spectator.query('.name');
    expect(appName).toHaveText('TestApp');
  });

  it('checks app version', () => {
    const appVersion = spectator.query('.version');
    expect(appVersion).toHaveText('v1.0.0');
  });
});

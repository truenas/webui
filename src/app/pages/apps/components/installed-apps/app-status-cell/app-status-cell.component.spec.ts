import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { CoreComponents } from 'app/core/core-components.module';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppStatusCellComponent } from 'app/pages/apps/components/installed-apps/app-status-cell/app-status-cell.component';

describe('AppStatusCellComponent', () => {
  let spectator: Spectator<AppStatusCellComponent>;

  const createComponent = createComponentFactory({
    component: AppStatusCellComponent,
    imports: [CoreComponents],
  });

  function setupTest(app: ChartRelease): void {
    spectator = createComponent({
      props: {
        app,
      },
    });
  }

  it('checks status for active app', () => {
    setupTest({ status: ChartReleaseStatus.Active } as ChartRelease);

    expect(spectator.query(AppStatusCellComponent)).toHaveText('Running');
  });
});

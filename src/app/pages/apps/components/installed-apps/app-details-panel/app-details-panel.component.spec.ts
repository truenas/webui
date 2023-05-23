import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppContainersCardComponent } from 'app/pages/apps/components/installed-apps/app-containers-card/app-containers-card.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppHistoryCardComponent } from 'app/pages/apps/components/installed-apps/app-history-card/app-history-card.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppMetadataCardComponent } from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-card.component';
import { AppNotesCardComponent } from 'app/pages/apps/components/installed-apps/app-notes-card/app-notes-card.component';

describe('AppDetailsPanelComponent', () => {
  let spectator: Spectator<AppDetailsPanelComponent>;

  const app = {
    id: 'ix-test-app',
    info: { notes: 'text' },
    app_metadata: {
      capabilities: Array.from({ length: 1 }).map((value, index) => ({
        name: `X${index}`,
        description: `This is being used to do X${index} thing`,
      })),
      hostMounts: Array.from({ length: 2 }).map((value, index) => ({
        hostPath: `/dev/proc${index}`,
        description: 'Required by netdata for xyz',
      })),
      runAsContext: Array.from({ length: 3 }).map((value, index) => ({
        uid: index,
        gid: index,
        userName: `ix-test-${index}`,
        groupName: `ix-test-${index}`,
        description: 'Why this needs to be done',
      })),
    },
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppDetailsPanelComponent,
    declarations: [
      MockComponents(
        AppInfoCardComponent,
        AppContainersCardComponent,
        AppHistoryCardComponent,
        AppNotesCardComponent,
        AppMetadataCardComponent,
      ),
    ],
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
    expect(spectator.query('h2')).toHaveText('Details');
  });

  it('shows all the cards', () => {
    const appInfoCard = spectator.query(AppInfoCardComponent);
    expect(appInfoCard).toBeTruthy();
    expect(appInfoCard.app).toBe(app);

    const appContainersCard = spectator.query(AppContainersCardComponent);
    expect(appContainersCard).toBeTruthy();
    expect(appContainersCard.app).toStrictEqual(app);

    const appHistoryCard = spectator.query(AppHistoryCardComponent);
    expect(appHistoryCard).toBeTruthy();
    expect(appHistoryCard.app).toStrictEqual(app);

    const appNotesCard = spectator.query(AppNotesCardComponent);
    expect(appNotesCard).toBeTruthy();
    expect(appNotesCard.app).toStrictEqual(app);

    const appMetadataCard = spectator.query(AppMetadataCardComponent);
    expect(appMetadataCard).toBeTruthy();
    expect(appMetadataCard.appMetadata).toStrictEqual(app.app_metadata);
  });
});

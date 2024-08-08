import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { App } from 'app/interfaces/app.interface';
import { AppContainersCardComponent } from 'app/pages/apps/components/installed-apps/app-containers-card/app-containers-card.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppMetadataCardComponent } from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-card.component';

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
  } as App;

  const createComponent = createComponentFactory({
    component: AppDetailsPanelComponent,
    declarations: [
      MockComponents(
        AppInfoCardComponent,
        AppContainersCardComponent,
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

    const appMetadataCard = spectator.query(AppMetadataCardComponent);
    expect(appMetadataCard).toBeTruthy();
    expect(appMetadataCard.appMetadata).toStrictEqual(app.app_metadata);
  });
});

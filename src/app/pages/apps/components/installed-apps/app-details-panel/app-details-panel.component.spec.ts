import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { App } from 'app/interfaces/app.interface';
import { MobileBackButtonComponent } from 'app/modules/buttons/mobile-back-button/mobile-back-button.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppMetadataCardComponent } from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-card.component';
import { AppWorkloadsCardComponent } from 'app/pages/apps/components/installed-apps/app-workloads-card/app-workloads-card.component';

describe('AppDetailsPanelComponent', () => {
  let spectator: Spectator<AppDetailsPanelComponent>;

  const app = {
    id: 'ix-test-app',
    metadata: {},
  } as App;

  const createComponent = createComponentFactory({
    component: AppDetailsPanelComponent,
    declarations: [
      MockComponents(
        AppInfoCardComponent,
        AppWorkloadsCardComponent,
        AppMetadataCardComponent,
        MobileBackButtonComponent,
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

    const appContainersCard = spectator.query(AppWorkloadsCardComponent);
    expect(appContainersCard).toBeTruthy();
    expect(appContainersCard.app).toStrictEqual(app);

    const appMetadataCard = spectator.query(AppMetadataCardComponent);
    expect(appMetadataCard).toBeTruthy();
    expect(appMetadataCard.appMetadata).toStrictEqual(app.metadata);
  });
});

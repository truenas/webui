import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { LazyLoadImageDirective } from 'ng-lazyload-image';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import {
  AppDetailsSimilarComponent,
} from 'app/pages/apps/components/app-detail-view/app-details-similar/app-details-similar.component';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

describe('AppDetailsSimilarComponent', () => {
  let spectator: Spectator<AppDetailsSimilarComponent>;
  const currentApp = {
    name: 'ipfs',
  } as AvailableApp;
  const similarApps = [
    {
      name: 'Minio',
    },
    {
      name: 'Storj',
    },
  ] as AvailableApp[];

  const createComponent = createComponentFactory({
    component: AppDetailsSimilarComponent,
    imports: [
      LazyLoadImageDirective,
      MockComponent(AppCardComponent),
    ],
    providers: [
      mockProvider(ApplicationsService, {
        getSimilarApps: jest.fn(() => of(similarApps)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app: currentApp,
      },
    });
  });

  it('loads and shows similar apps', () => {
    expect(spectator.inject(ApplicationsService).getSimilarApps).toHaveBeenCalledWith(currentApp);

    const appCards = spectator.queryAll(AppCardComponent);
    expect(appCards).toHaveLength(2);
    expect(appCards[0].app).toEqual(similarApps[0]);
    expect(appCards[1].app).toEqual(similarApps[1]);
  });
});

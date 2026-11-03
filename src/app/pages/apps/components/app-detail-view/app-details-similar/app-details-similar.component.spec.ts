import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { LazyLoadImageDirective } from 'ng-lazyload-image';
import { MockComponent } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';
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

  it('reloads similar apps when the app changes', () => {
    const otherApp = { name: 'minio' } as AvailableApp;
    const appService = spectator.inject(ApplicationsService);
    jest.spyOn(appService, 'getSimilarApps').mockReturnValueOnce(of([{ name: 'Syncthing' }] as AvailableApp[]));

    spectator.setInput('app', otherApp);

    expect(appService.getSimilarApps).toHaveBeenLastCalledWith(otherApp);
    expect(spectator.queryAll(AppCardComponent).map((card) => card.app.name)).toEqual(['Syncthing']);
  });

  it('ignores a late answer for an app the user already moved away from', () => {
    const slowAnswer$ = new Subject<AvailableApp[]>();
    const appService = spectator.inject(ApplicationsService);
    jest.spyOn(appService, 'getSimilarApps')
      .mockReturnValueOnce(slowAnswer$)
      .mockReturnValueOnce(of([{ name: 'Syncthing' }] as AvailableApp[]));

    spectator.setInput('app', { name: 'slow' } as AvailableApp);
    spectator.setInput('app', { name: 'fast' } as AvailableApp);
    slowAnswer$.next([{ name: 'Stale' }] as AvailableApp[]);
    spectator.detectChanges();

    expect(spectator.queryAll(AppCardComponent).map((card) => card.app.name)).toEqual(['Syncthing']);
  });

  it('shows an error when similar apps cannot be loaded, and recovers on the next app', () => {
    jest.spyOn(console, 'error').mockImplementation();
    const appService = spectator.inject(ApplicationsService);
    jest.spyOn(appService, 'getSimilarApps').mockReturnValueOnce(throwError(() => new Error('Boom')));

    spectator.setInput('app', { name: 'broken' } as AvailableApp);

    expect(spectator.query('.no-similar')).toHaveText('Error when loading similar apps.');
    expect(console.error).toHaveBeenCalledWith(new Error('Boom'));

    spectator.setInput('app', { name: 'minio' } as AvailableApp);

    expect(spectator.query('.no-similar')).not.toExist();
    expect(spectator.queryAll(AppCardComponent)).toHaveLength(2);
  });
});

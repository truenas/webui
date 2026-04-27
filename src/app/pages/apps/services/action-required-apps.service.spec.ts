import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { Subject, of, throwError } from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App } from 'app/interfaces/app.interface';
import { ActionRequiredAppsService } from 'app/pages/apps/services/action-required-apps.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

describe('ActionRequiredAppsService', () => {
  let spectator: SpectatorService<ActionRequiredAppsService>;
  let updates$: Subject<ApiEvent<App>>;

  const buildFactory = (apps$: ReturnType<typeof of>): void => {
    updates$ = new Subject<ApiEvent<App>>();
    spectator = createServiceFactory({
      service: ActionRequiredAppsService,
      providers: [
        mockProvider(ApplicationsService, {
          getAllApps: jest.fn(() => apps$),
          getInstalledAppsUpdates: jest.fn(() => updates$),
        }),
      ],
    })();
  };

  it('reports false when no apps require action', () => {
    buildFactory(of([{ name: 'a', action_required: false } as App]));
    spectator.service.initialize();
    expect(spectator.service.hasActionRequired()).toBe(false);
  });

  it('reports true when at least one app requires action', () => {
    buildFactory(of([
      { name: 'a', action_required: false } as App,
      { name: 'b', action_required: true } as App,
    ]));
    spectator.service.initialize();
    expect(spectator.service.hasActionRequired()).toBe(true);
  });

  it('updates when an app changes via subscription', () => {
    buildFactory(of([{ name: 'a', action_required: false } as App]));
    spectator.service.initialize();
    expect(spectator.service.hasActionRequired()).toBe(false);

    updates$.next({
      collection: 'app.query',
      msg: CollectionChangeType.Changed,
      id: 'a',
      fields: { name: 'a', action_required: true } as App,
    } as ApiEvent<App>);
    expect(spectator.service.hasActionRequired()).toBe(true);

    updates$.next({
      collection: 'app.query',
      msg: CollectionChangeType.Removed,
      id: 'a',
    } as ApiEvent<App>);
    expect(spectator.service.hasActionRequired()).toBe(false);
  });

  it('survives errors from getAllApps', () => {
    buildFactory(throwError(() => new Error('boom')));
    spectator.service.initialize();
    expect(spectator.service.hasActionRequired()).toBe(false);
  });

  it('initializes only once', () => {
    buildFactory(of([{ name: 'a', action_required: true } as App]));
    spectator.service.initialize();
    spectator.service.initialize();

    const apps = spectator.inject(ApplicationsService);
    expect(apps.getAllApps).toHaveBeenCalledTimes(1);
  });
});

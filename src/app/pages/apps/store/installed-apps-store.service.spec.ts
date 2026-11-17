import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { App } from 'app/interfaces/app.interface';
import { AppQueryEvent, ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

describe('InstalledAppsStore', () => {
  let spectator: SpectatorService<InstalledAppsStore>;
  let appEvents$: Subject<AppQueryEvent>;
  const isDockerLoading = signal(false);
  const isDockerStarted = signal<boolean | null>(true);

  const installedApps = [{ name: 'minio' }] as App[];

  const createService = createServiceFactory({
    service: InstalledAppsStore,
    providers: [
      mockProvider(ApplicationsService, {
        getInstalledAppsUpdates: jest.fn(() => appEvents$),
        getAllApps: jest.fn(() => of(installedApps)),
      }),
      mockProvider(AppsStore, {
        setAppInstalled: jest.fn(),
      }),
      mockProvider(AppsStatsService),
      mockProvider(DockerStore, {
        isLoading: isDockerLoading,
        isDockerStarted,
      }),
    ],
  });

  beforeEach(() => {
    isDockerLoading.set(false);
    isDockerStarted.set(true);
    appEvents$ = new Subject<AppQueryEvent>();
    spectator = createService();
    // Docker state reaches the store through an effect.
    TestBed.tick();
  });

  it('loads the installed apps once Docker is running', () => {
    expect(spectator.service.installedApps()).toEqual(installedApps);
    expect(spectator.service.isLoading()).toBe(false);
  });

  it('subscribes to app stats once there are installed apps', () => {
    expect(spectator.inject(AppsStatsService).subscribeToUpdates).toHaveBeenCalledTimes(1);
  });

  it('waits for Docker before loading the installed apps', () => {
    const appsService = spectator.inject(ApplicationsService);
    isDockerStarted.set(false);
    TestBed.tick();
    jest.mocked(appsService.getAllApps).mockClear();

    spectator.service.initialize();

    expect(appsService.getAllApps).not.toHaveBeenCalled();
    expect(spectator.service.installedApps()).toEqual([]);
    expect(spectator.service.isLoading()).toBe(false);

    isDockerStarted.set(true);
    TestBed.tick();

    expect(appsService.getAllApps).toHaveBeenCalledTimes(1);
    expect(spectator.service.installedApps()).toEqual(installedApps);
  });

  it('keeps the search query and the sorting', () => {
    spectator.service.setSearchQuery('plex');
    spectator.service.setSortingInfo({ active: 'state', direction: 'desc' });

    expect(spectator.service.searchQuery()).toBe('plex');
    expect(spectator.service.sortingInfo()).toEqual({ active: 'state', direction: 'desc' });
  });

  describe('installed app events', () => {
    it('adds an installed app and marks it installed in the catalog', () => {
      appEvents$.next({ msg: 'added', id: 'plex', fields: { id: 'plex', name: 'plex' } as App });

      expect(spectator.service.installedApps()).toEqual([
        { name: 'minio' },
        { id: 'plex', name: 'plex' },
      ]);
      expect(spectator.inject(AppsStore).setAppInstalled).toHaveBeenCalledWith('plex', true);
    });

    it('merges a change into the installed app it names', () => {
      appEvents$.next({ msg: 'changed', id: 'minio', fields: { id: 'minio', version: '2.0' } as App });

      expect(spectator.service.installedApps()).toEqual([
        { name: 'minio', id: 'minio', version: '2.0' },
      ]);
    });

    it('drops a removed app and marks it not installed in the catalog', () => {
      appEvents$.next({ msg: 'removed', id: 'minio' });

      expect(spectator.service.installedApps()).toEqual([]);
      expect(spectator.inject(AppsStore).setAppInstalled).toHaveBeenCalledWith('minio', false);
    });
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { App } from 'app/interfaces/app.interface';
import { AppBulkActionsPanelComponent } from './app-bulk-actions-panel.component';

describe('AppBulkActionsPanelComponent', () => {
  let spectator: Spectator<AppBulkActionsPanelComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AppBulkActionsPanelComponent,
    providers: [mockAuth()],
  });

  describe('with mixed app states', () => {
    const checkedAppsMock = [
      { id: 'app-1', name: 'Plex', state: AppState.Running },
      { id: 'app-2', name: 'Nextcloud', state: AppState.Stopped },
      {
        id: 'app-3', name: 'Minio', state: AppState.Running, upgrade_available: true,
      },
      { id: 'app-4', name: 'Netdata', state: AppState.Running },
    ] as App[];

    beforeEach(() => {
      spectator = createComponent({
        props: { checkedApps: checkedAppsMock },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('emits bulkStart when Start All Selected is clicked', async () => {
      const startSpy = jest.spyOn(spectator.component.bulkStart, 'emit');
      const startButton = await loader.getHarness(MatButtonHarness.with({ text: 'Start All Selected' }));
      await startButton.click();
      expect(startSpy).toHaveBeenCalled();
    });

    it('emits bulkStop when Stop All Selected is clicked', async () => {
      const stopSpy = jest.spyOn(spectator.component.bulkStop, 'emit');
      const stopButton = await loader.getHarness(MatButtonHarness.with({ text: 'Stop All Selected' }));
      await stopButton.click();
      expect(stopSpy).toHaveBeenCalled();
    });

    it('emits bulkUpdate when Update All Selected is clicked', async () => {
      const updateSpy = jest.spyOn(spectator.component.bulkUpdate, 'emit');
      const updateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Update All Selected' }));
      await updateButton.click();
      expect(updateSpy).toHaveBeenCalled();
    });

    it('emits bulkDelete when Delete All Selected is clicked', async () => {
      const deleteSpy = jest.spyOn(spectator.component.bulkDelete, 'emit');
      const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete All Selected' }));
      await deleteButton.click();
      expect(deleteSpy).toHaveBeenCalled();
    });
  });

  describe('button disabled states', () => {
    it('disables Start when all apps are already running', async () => {
      spectator = createComponent({
        props: {
          checkedApps: [
            { id: 'app-1', state: AppState.Running },
            { id: 'app-2', state: AppState.Running },
          ] as App[],
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const startButton = await loader.getHarness(MatButtonHarness.with({ text: 'Start All Selected' }));
      expect(await startButton.isDisabled()).toBe(true);
    });

    it('disables Stop when all apps are already stopped', async () => {
      spectator = createComponent({
        props: {
          checkedApps: [
            { id: 'app-1', state: AppState.Stopped },
            { id: 'app-2', state: AppState.Stopped },
          ] as App[],
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const stopButton = await loader.getHarness(MatButtonHarness.with({ text: 'Stop All Selected' }));
      expect(await stopButton.isDisabled()).toBe(true);
    });

    it('disables Update when no apps have updates available', async () => {
      spectator = createComponent({
        props: {
          checkedApps: [
            { id: 'app-1', state: AppState.Running, upgrade_available: false },
            { id: 'app-2', state: AppState.Running, upgrade_available: false },
          ] as App[],
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const updateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Update All Selected' }));
      expect(await updateButton.isDisabled()).toBe(true);
    });

    it('enables Update when at least one app has an update available', async () => {
      spectator = createComponent({
        props: {
          checkedApps: [
            { id: 'app-1', state: AppState.Running, upgrade_available: false },
            { id: 'app-2', state: AppState.Running, upgrade_available: true },
          ] as App[],
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const updateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Update All Selected' }));
      expect(await updateButton.isDisabled()).toBe(false);
    });
  });
});

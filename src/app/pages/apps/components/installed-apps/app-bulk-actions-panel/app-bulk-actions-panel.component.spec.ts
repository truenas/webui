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

  const checkedAppsMock = [
    { id: 'app-1', name: 'Plex', state: AppState.Running },
    { id: 'app-2', name: 'Nextcloud', state: AppState.Stopped },
    { id: 'app-3', name: 'Minio', state: AppState.Running },
    { id: 'app-4', name: 'Netdata', state: AppState.Running },
  ] as App[];

  const createComponent = createComponentFactory({
    component: AppBulkActionsPanelComponent,
    providers: [mockAuth()],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { checkedApps: checkedAppsMock },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows the count of selected apps', () => {
    const message = spectator.query('.info-message');
    expect(message).toHaveText('4 apps selected');
  });

  it('shows first 3 app names and remaining count', () => {
    const listItems = spectator.queryAll('.selected-apps li');
    expect(listItems).toHaveLength(3);
    expect(listItems[0]).toHaveText('Plex');
    expect(listItems[1]).toHaveText('Nextcloud');
    expect(listItems[2]).toHaveText('Minio');

    const moreApps = spectator.query('.more-apps');
    expect(moreApps).toHaveText('and 1 more');
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

  it('emits bulkDelete when Delete All Selected is clicked', async () => {
    const deleteSpy = jest.spyOn(spectator.component.bulkDelete, 'emit');
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete All Selected' }));
    await deleteButton.click();
    expect(deleteSpy).toHaveBeenCalled();
  });
});

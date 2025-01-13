import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DriveBayLightStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { IdentifyLightComponent } from 'app/pages/system/enclosure/components/identify-light/identify-light.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('IdentifyLightComponent', () => {
  let spectator: Spectator<IdentifyLightComponent>;
  let loader: HarnessLoader;
  const selectedSlot = signal({
    drive_bay_number: 5,
  } as DashboardEnclosureSlot);
  const createComponent = createComponentFactory({
    component: IdentifyLightComponent,
    providers: [
      mockApi([
        mockCall('enclosure2.set_slot_status'),
      ]),
      mockProvider(EnclosureStore, {
        selectedSlot,
        selectedEnclosure: () => ({ id: 'enclosure1' }),
        changeLightStatus: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    selectedSlot.set({
      drive_bay_number: 5,
    } as DashboardEnclosureSlot);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('when status is null', () => {
    it('shows status string', async () => {
      expect(spectator.query('.status-line')).toHaveText('Light status is unknown.');

      const icon = await loader.getHarness(IxIconHarness.with({ ancestor: '.status-line' }));
      expect(await icon.getName()).toBe('mdi-lightbulb-question-outline');
    });

    it('shows both Identify and Turn Off buttons', async () => {
      const identifyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Identify' }));
      expect(identifyButton).toExist();

      const turnOffButton = await loader.getHarness(MatButtonHarness.with({ text: 'Turn Off' }));
      expect(turnOffButton).toExist();
    });
  });

  describe('when status is off', () => {
    beforeEach(() => {
      selectedSlot.set({
        drive_bay_number: 5,
        drive_bay_light_status: DriveBayLightStatus.Off,
      } as DashboardEnclosureSlot);
      spectator.detectChanges();
    });

    it('shows status string', async () => {
      expect(spectator.query('.status-line')).toHaveText('Identify light is off.');

      const icon = await loader.getHarness(IxIconHarness.with({ ancestor: '.status-line' }));
      expect(await icon.getName()).toBe('mdi-lightbulb-off-outline');
    });

    it('shows Identify button', async () => {
      const identifyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Identify' }));
      expect(identifyButton).toExist();
    });
  });

  describe('when status is on', () => {
    beforeEach(() => {
      selectedSlot.set({
        drive_bay_number: 5,
        drive_bay_light_status: DriveBayLightStatus.On,
      } as DashboardEnclosureSlot);
      spectator.detectChanges();
    });

    it('shows status string', async () => {
      expect(spectator.query('.status-line')).toHaveText('Identify light is on.');

      const icon = await loader.getHarness(IxIconHarness.with({ ancestor: '.status-line' }));
      expect(await icon.getName()).toBe('mdi-lightbulb-on');
    });

    it('shows turn off button', async () => {
      const turnOffButton = await loader.getHarness(MatButtonHarness.with({ text: 'Turn Off' }));
      expect(turnOffButton).toExist();
    });
  });

  describe('when status is Clear', () => {
    beforeEach(() => {
      selectedSlot.set({
        drive_bay_number: 5,
        drive_bay_light_status: DriveBayLightStatus.Clear,
      } as DashboardEnclosureSlot);
      spectator.detectChanges();
    });

    it('shows status string', async () => {
      expect(spectator.query('.status-line')).toHaveText('Identify light is off.');

      const icon = await loader.getHarness(IxIconHarness.with({ ancestor: '.status-line' }));
      expect(await icon.getName()).toBe('mdi-lightbulb-off-outline');
    });

    it('shows Identify button', async () => {
      const identifyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Identify' }));
      expect(identifyButton).toExist();
    });
  });

  describe('changing status', () => {
    it('changes identify status of Off when Turn Off is pressed', async () => {
      const turnOffButton = await loader.getHarness(MatButtonHarness.with({ text: 'Turn Off' }));
      await turnOffButton.click();

      expect(spectator.inject(EnclosureStore).changeLightStatus).toHaveBeenCalledWith({
        driveBayNumber: 5,
        enclosureId: 'enclosure1',
        status: DriveBayLightStatus.Off,
      });
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('enclosure2.set_slot_status', [{
        enclosure_id: 'enclosure1',
        slot: 5,
        status: DriveBayLightStatus.Off,
      }]);
    });

    it('changes identify status to Identify when corresponding button is pressed', async () => {
      const identifyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Identify' }));
      await identifyButton.click();

      expect(spectator.inject(EnclosureStore).changeLightStatus).toHaveBeenCalledWith({
        driveBayNumber: 5,
        enclosureId: 'enclosure1',
        status: DriveBayLightStatus.On,
      });
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('enclosure2.set_slot_status', [{
        enclosure_id: 'enclosure1',
        slot: 5,
        status: DriveBayLightStatus.On,
      }]);
    });

    it('reverts to old status if status could not be changed', async () => {
      const api = spectator.inject(ApiService);
      api.call.mockImplementationOnce(() => throwError(() => new Error('Failed to change status')));

      const identifyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Identify' }));
      await identifyButton.click();

      const store = spectator.inject(EnclosureStore);
      expect(store.changeLightStatus).toHaveBeenCalledTimes(2);
      expect(store.changeLightStatus).toHaveBeenLastCalledWith({
        driveBayNumber: 5,
        enclosureId: 'enclosure1',
        status: undefined,
      });
    });
  });
});

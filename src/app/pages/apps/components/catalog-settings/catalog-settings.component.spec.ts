import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Catalog } from 'app/interfaces/catalog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxListHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.harness';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';

import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { CatalogSettingsComponent } from 'app/pages/apps/components/catalog-settings/catalog-settings.component';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { WebSocketService } from 'app/services/ws.service';

describe('CatalogEditFormComponent', () => {
  let spectator: Spectator<CatalogSettingsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CatalogSettingsComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('catalog.update'),
        mockCall('catalog.trains', ['stable', 'community', 'test']),
        mockCall('catalog.config', {
          label: 'TrueNAS',
          preferred_trains: ['test'],
        } as Catalog),
      ]),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(AppsStore),
      mockProvider(IxSlideInRef),
      mockProvider(FormErrorHandlerService),
      mockAuth(),
    ],
  });

  describe('no docker lacks nvidia drivers', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(DockerStore, {
            nvidiaDriversInstalled$: of(false),
            lacksNvidiaDrivers$: of(false),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('loads list of available trains and shows them', async () => {
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('catalog.trains');

      const checkboxList = await loader.getHarness(IxCheckboxListHarness);
      const checkboxes = await checkboxList.getCheckboxes();
      expect(checkboxes).toHaveLength(3);
      expect(await checkboxes[0].getLabelText()).toBe('stable');
      expect(await checkboxes[1].getLabelText()).toBe('community');
      expect(await checkboxes[2].getLabelText()).toBe('test');
    });

    it('shows preferred trains when catalog is open for editing', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        'Preferred Trains': ['test'],
      });
    });

    it('saves catalog updates and reloads catalog apps when form is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Preferred Trains': ['stable', 'community'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('catalog.update', [
        { preferred_trains: ['stable', 'community'] },
      ]);
      expect(spectator.inject(AppsStore).loadCatalog).toHaveBeenCalled();
    });
  });

  describe('has docker lacks nvidia drivers', () => {
    describe('lacksNvidiaDrivers is true', () => {
      beforeEach(() => {
        spectator = createComponent({
          providers: [
            mockProvider(DockerStore, {
              nvidiaDriversInstalled$: of(false),
              lacksNvidiaDrivers$: of(true),
              setDockerNvidia: jest.fn(() => of(null)),
            }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      });

      it('shows Install NDIVIA Drivers checkbox when lacksNvidiaDrivers is true', async () => {
        const form = await loader.getHarness(IxFormHarness);
        const values = await form.getValues();

        expect(values).toEqual({
          'Install NDIVIA Drivers': false,
          'Preferred Trains': ['test'],
        });
      });

      it('saves catalog updates and nvidia settings', async () => {
        const form = await loader.getHarness(IxFormHarness);
        await form.fillForm({
          'Preferred Trains': ['stable'],
          'Install NDIVIA Drivers': true,
        });

        const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        await saveButton.click();

        expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('catalog.update', [
          { preferred_trains: ['stable'] },
        ]);

        expect(spectator.inject(DockerStore).setDockerNvidia).toHaveBeenCalled();
        expect(spectator.inject(AppsStore).loadCatalog).toHaveBeenCalled();
      });
    });

    describe('lacksNvidiaDrivers is false and nvidiaDriversInstalled is true', () => {
      beforeEach(() => {
        spectator = createComponent({
          providers: [
            mockProvider(DockerStore, {
              nvidiaDriversInstalled$: of(true),
              lacksNvidiaDrivers$: of(false),
            }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      });

      it('shows Install NDIVIA Drivers checkbox when docker.lacks_nvidia_drivers is true OR when it is checked (so the user can uncheck it)', async () => {
        const form = await loader.getHarness(IxFormHarness);
        const values = await form.getValues();

        expect(values).toEqual({
          'Install NDIVIA Drivers': true,
          'Preferred Trains': ['test'],
        });
      });
    });
  });
});

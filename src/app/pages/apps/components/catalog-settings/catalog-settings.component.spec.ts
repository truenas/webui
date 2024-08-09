import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Catalog } from 'app/interfaces/catalog.interface';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { CatalogSettingsComponent } from 'app/pages/apps/components/catalog-settings/catalog-settings.component';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { WebSocketService } from 'app/services/ws.service';

describe('CatalogEditFormComponent', () => {
  let spectator: Spectator<CatalogSettingsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CatalogSettingsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('catalog.update'),
        mockCall('catalog.config', {
          label: 'TrueNAS',
          preferred_trains: ['test'],
        } as Catalog),
      ]),
      mockProvider(AppsStore),
      mockProvider(IxSlideInRef),
      mockProvider(FormErrorHandlerService),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
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
      'Preferred Trains': ['stable', 'incubator'],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('catalog.update', [
      { preferred_trains: ['stable', 'incubator'] },
    ]);
    expect(spectator.inject(AppsStore).loadCatalog).toHaveBeenCalled();
  });
});

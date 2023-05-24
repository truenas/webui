import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { CatalogEditFormComponent } from 'app/pages/apps-old/forms/catalog-edit-form/catalog-edit-form.component';
import { WebSocketService } from 'app/services/ws.service';

describe('CatalogEditFormComponent', () => {
  let spectator: Spectator<CatalogEditFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const catalog = {
    id: 'truenas',
    label: 'Truenas',
    trains: {
      test: {},
      stable: {},
      incubator: {},
    },
    preferred_trains: ['test'],
  };
  const createComponent = createComponentFactory({
    component: CatalogEditFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('catalog.update'),
      ]),
      mockProvider(IxSlideInRef),
      mockProvider(FormErrorHandlerService),
      { provide: SLIDE_IN_DATA, useValue: catalog },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('shows catalog name and preferred trains when catalog is open for editing', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Catalog Name': 'Truenas',
      'Preferred Trains': ['test'],
    });
  });

  it('saves catalog updates when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Preferred Trains': ['stable', 'incubator'],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('catalog.update', [
      'truenas',
      { preferred_trains: ['stable', 'incubator'] },
    ]);
  });
});

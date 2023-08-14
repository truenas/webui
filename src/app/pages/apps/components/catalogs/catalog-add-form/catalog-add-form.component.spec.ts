import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  CatalogAddFormComponent,
} from 'app/pages/apps/components/catalogs/catalog-add-form/catalog-add-form.component';
import { DialogService } from 'app/services/dialog.service';

describe('CatalogAddFormComponent', () => {
  let spectator: Spectator<CatalogAddFormComponent>;
  let loader: HarnessLoader;

  const mockDialogRef = {
    componentInstance: {
      setDescription: jest.fn(),
      setCall: jest.fn(),
      submit: jest.fn(),
      success: new EventEmitter(),
      failure: new EventEmitter(),
    },
    close: jest.fn(),
  } as unknown as MatDialogRef<EntityJobComponent>;

  const createComponent = createComponentFactory({
    component: CatalogAddFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockJob('catalog.create'),
      ]),
      mockProvider(IxSlideInRef),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockDialogRef),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('saves new catalog when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Catalog Name': 'truecharts',
      'Force Create': true,
      Repository: 'https://github.com/truecharts/catalog',
      'Preferred Trains': ['stable', 'incubator'],
      Branch: 'main',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(mockDialogRef.componentInstance.setCall).toHaveBeenCalledWith('catalog.create', [{
      label: 'truecharts',
      force: true,
      branch: 'main',
      repository: 'https://github.com/truecharts/catalog',
      preferred_trains: ['stable', 'incubator'],
    }]);
  });
});

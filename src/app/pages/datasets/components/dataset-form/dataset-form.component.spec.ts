import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents, MockInstance } from 'ng-mocks';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AclMode } from 'app/enums/acl-type.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import {
  EncryptionSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/encryption-section/encryption-section.component';
import {
  NameAndOptionsSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/name-and-options-section/name-and-options-section.component';
import {
  OtherOptionsSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/other-options-section/other-options-section.component';
import {
  QuotasSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/quotas-section/quotas-section.component';
import { DatasetFormService } from 'app/pages/datasets/components/dataset-form/utils/dataset-form.service';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DatasetFormComponent', () => {
  let spectator: Spectator<DatasetFormComponent>;
  let loader: HarnessLoader;

  MockInstance(NameAndOptionsSectionComponent, 'getPayload', () => ({
    name: 'dataset',
  }));
  MockInstance(EncryptionSectionComponent, 'getPayload', () => ({
    encryption: true,
  }));
  MockInstance(QuotasSectionComponent, 'getPayload', () => ({
    refquota: GiB,
  }));
  MockInstance(OtherOptionsSectionComponent, 'getPayload', () => ({
    aclmode: AclMode.Passthrough,
  }));

  const existingDataset = {
    id: 'parent/child',
  } as Dataset;
  const parentDataset = {
    id: 'parent',
  } as Dataset;

  const createComponent = createComponentFactory({
    component: DatasetFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      MockComponents(
        NameAndOptionsSectionComponent,
        EncryptionSectionComponent,
        QuotasSectionComponent,
        OtherOptionsSectionComponent,
      ),
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.dataset.create', { id: 'saved-id' } as Dataset),
        mockCall('pool.dataset.update', { id: 'saved-id' } as Dataset),
        mockCall('filesystem.acl_is_trivial', false),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(IxSlideInService),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(DatasetFormService, {
        ensurePathLimits: jest.fn(() => of(undefined)),
        loadDataset: jest.fn((path) => {
          if (path === 'parent/child') {
            return of(existingDataset);
          }

          return of(parentDataset);
        }),
      }),
      mockProvider(Router),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('first checks', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('toggles between Advanced mode when corresponding button is pressed', async () => {
      expect(spectator.query(OtherOptionsSectionComponent).advancedMode).toBe(false);
      expect(spectator.query(QuotasSectionComponent)).not.toExist();

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      expect(spectator.query(OtherOptionsSectionComponent).advancedMode).toBe(true);
      expect(spectator.query(QuotasSectionComponent)).toExist();

      const basicButton = await loader.getHarness(MatButtonHarness.with({ text: 'Basic Options' }));
      await basicButton.click();

      expect(spectator.query(OtherOptionsSectionComponent).advancedMode).toBe(false);
      expect(spectator.query(QuotasSectionComponent)).not.toExist();
    });
  });

  describe('second checks', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              datasetId: 'parent/child',
              isNew: true,
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('ensures path limits when form is opened for adding a new form', () => {
      expect(spectator.inject(DatasetFormService).ensurePathLimits).toHaveBeenCalledWith('parent/child');
    });
  });

  describe('third checks', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              datasetId: 'parent',
              isNew: true,
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('creates a new dataset when new form is submitted', async () => {
      const submit = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submit.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.dataset.create', [{
        name: 'dataset',
        encryption: true,
        aclmode: AclMode.Passthrough,
      }]);
    });

    it('creates a new dataset in advanced mode when new form is submitted', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const submit = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submit.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.dataset.create', [{
        name: 'dataset',
        encryption: true,
        refquota: GiB,
        aclmode: AclMode.Passthrough,
      }]);
    });

    it('checks if parent has ACL and offers to go to ACL editor if it does', async () => {
      const submit = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submit.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('filesystem.acl_is_trivial', ['/mnt/parent']);
      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: helptext.afterSubmitDialog.title,
          message: helptext.afterSubmitDialog.message,
        }),
      );
    });
  });

  describe('fourth checks', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              datasetId: 'parent/child',
              isNew: false,
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('updates an existing child dataset when edit form is submitted', async () => {
      const submit = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submit.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.dataset.update', ['parent/child', {
        name: 'dataset',
        aclmode: AclMode.Passthrough,
      }]);
    });
  });

  describe('fifth checks', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              datasetId: 'parent',
              isNew: false,
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('updates an existing root dataset when edit form is submitted', async () => {
      const submit = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submit.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.dataset.update', ['parent', {
        name: 'dataset',
        aclmode: AclMode.Passthrough,
      }]);
    });
  });
});

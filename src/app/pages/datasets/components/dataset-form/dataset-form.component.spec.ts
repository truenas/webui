import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockComponents, MockInstance } from 'ng-mocks';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AclMode } from 'app/enums/acl-type.enum';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
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
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';

describe('DatasetFormComponent', () => {
  let spectator: Spectator<DatasetFormComponent>;
  let loader: HarnessLoader;

  const datasetPresetForm = new FormGroup({
    create_smb: new FormControl(true),
    create_nfs: new FormControl(true),
    smb_name: new FormControl('new_sbm_name'),
  });

  MockInstance(NameAndOptionsSectionComponent, 'form', new FormGroup({
    name: new FormControl(''),
    parent: new FormControl(''),
    share_type: new FormControl(DatasetPreset.Generic),
  }));
  MockInstance(NameAndOptionsSectionComponent, 'datasetPresetForm', datasetPresetForm);
  MockInstance(NameAndOptionsSectionComponent, 'canCreateSmb', true);
  MockInstance(NameAndOptionsSectionComponent, 'canCreateNfs', true);
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
      mockWebSocket([
        mockCall('sharing.smb.create'),
        mockCall('sharing.nfs.create'),
        mockCall('pool.dataset.create', { id: 'saved-id' } as Dataset),
        mockCall('pool.dataset.update', { id: 'saved-id' } as Dataset),
        mockCall('filesystem.stat', { acl: true } as FileSystemStat),
      ]),
      mockProvider(SlideInService),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(DatasetFormService, {
        checkAndWarnForLengthAndDepth: jest.fn(() => of(true)),
        loadDataset: jest.fn((path) => {
          if (path === 'parent/child') {
            return of(existingDataset);
          }

          return of(parentDataset);
        }),
      }),
      mockProvider(Router),
      mockProvider(SlideInRef),
      mockAuth(),
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
      expect(spectator.inject(DatasetFormService).checkAndWarnForLengthAndDepth).toHaveBeenCalledWith('parent/child');
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

    it('creates new SMB and NFS when new form is submitted', async () => {
      jest.spyOn(spectator.inject(Store), 'dispatch');
      const submit = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submit.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('sharing.smb.create', [{
        name: 'new_sbm_name',
        path: '/mnt/saved-id',
      }]);

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('sharing.nfs.create', [{
        path: '/mnt/saved-id',
      }]);

      expect(spectator.inject(Store).dispatch).toHaveBeenCalledWith(
        checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }),
      );
      expect(spectator.inject(Store).dispatch).toHaveBeenCalledWith(
        checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }),
      );
    });

    it('skips creation new SMB and NFS when checkboxes are set to false', async () => {
      datasetPresetForm.controls.create_smb.setValue(false);
      datasetPresetForm.controls.create_nfs.setValue(false);

      jest.spyOn(spectator.inject(Store), 'dispatch');
      const submit = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submit.click();

      expect(spectator.inject(WebSocketService).call).not.toHaveBeenCalledWith('sharing.smb.create', [{
        name: 'new_sbm_name',
        path: '/mnt/saved-id',
      }]);

      expect(spectator.inject(WebSocketService).call).not.toHaveBeenCalledWith('sharing.nfs.create', [{
        path: '/mnt/saved-id',
      }]);

      expect(spectator.inject(Store).dispatch).not.toHaveBeenCalledWith(
        checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }),
      );
      expect(spectator.inject(Store).dispatch).not.toHaveBeenCalledWith(
        checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }),
      );
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

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('filesystem.stat', ['/mnt/parent']);
      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: helptextDatasetForm.afterSubmitDialog.title,
          message: helptextDatasetForm.afterSubmitDialog.message,
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

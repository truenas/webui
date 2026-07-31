import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockComponents, MockInstance } from 'ng-mocks';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AclMode } from 'app/enums/acl-type.enum';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { SmbSharePurpose } from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
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
import { FilesystemService } from 'app/services/filesystem.service';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';

describe('DatasetFormComponent', () => {
  let spectator: Spectator<DatasetFormComponent>;

  const datasetPresetForm = new FormGroup({
    create_smb: new FormControl(true, { nonNullable: true }),
    create_nfs: new FormControl(true, { nonNullable: true }),
    smb_name: new FormControl('new_sbm_name', { nonNullable: true }),
  });

  const nameAndOptionsForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    parent: new FormControl('', { nonNullable: true }),
    share_type: new FormControl(DatasetPreset.Generic, { nonNullable: true }),
  });
  MockInstance(NameAndOptionsSectionComponent, 'form', nameAndOptionsForm);
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
      mockApi([
        mockCall('sharing.smb.create'),
        mockCall('sharing.nfs.create'),
        mockCall('pool.dataset.create', { id: 'saved-id', mountpoint: '/mnt/saved-id' } as Dataset),
        mockCall('pool.dataset.update', { id: 'saved-id', mountpoint: '/mnt/saved-id' } as Dataset),
        mockCall('filesystem.stat', { acl: true } as FileSystemStat),
      ]),
      ...ixFormTestingProviders(),
      // Panel host: skip the minimum-feedback delay so the close is observable synchronously.
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
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
      mockProvider(FilesystemService),
      mockAuth(),
    ],
  });

  /** The `<tn-side-panel>` host owns Save and the Advanced toggle, and drives them through the form. */
  const clickSave = (): void => spectator.component.submit();
  const toggleAdvanced = (): void => {
    spectator.component.footerActions[0].onClick();
    spectator.detectChanges();
  };

  describe('first checks', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { params: { datasetId: 'dataset', isNew: true } } });
    });

    it('toggles between Advanced mode from the panel footer action', () => {
      expect(spectator.query(OtherOptionsSectionComponent)!.advancedMode).toBe(false);
      expect(spectator.query(QuotasSectionComponent)).not.toExist();
      expect(spectator.component.footerActions[0].label).toBe('Advanced Options');

      toggleAdvanced();

      expect(spectator.query(OtherOptionsSectionComponent)!.advancedMode).toBe(true);
      expect(spectator.query(QuotasSectionComponent)).toExist();
      expect(spectator.component.footerActions[0].label).toBe('Basic Options');

      toggleAdvanced();

      expect(spectator.query(OtherOptionsSectionComponent)!.advancedMode).toBe(false);
      expect(spectator.query(QuotasSectionComponent)).not.toExist();
    });
  });

  describe('second checks', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { params: { datasetId: 'parent/child', isNew: true } } });
    });

    it('ensures path limits when form is opened for adding a new form', () => {
      expect(spectator.inject(DatasetFormService).checkAndWarnForLengthAndDepth).toHaveBeenCalledWith('parent/child');
    });
  });

  describe('third checks', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { params: { datasetId: 'parent', isNew: true } } });
    });

    it('creates new SMB and NFS when new form is submitted', () => {
      jest.spyOn(spectator.inject(Store), 'dispatch');
      clickSave();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.smb.create', [{
        name: 'new_sbm_name',
        path: '/mnt/saved-id',
      }]);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.nfs.create', [{
        path: '/mnt/saved-id',
      }]);

      expect(spectator.inject(Store).dispatch).toHaveBeenCalledWith(
        checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }),
      );
      expect(spectator.inject(Store).dispatch).toHaveBeenCalledWith(
        checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }),
      );
    });

    it('sets purpose to MultiProtocolShare on SMB create when Multiprotocol preset is selected', () => {
      nameAndOptionsForm.controls.share_type.setValue(DatasetPreset.Multiprotocol);

      clickSave();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.smb.create', [{
        name: 'new_sbm_name',
        path: '/mnt/saved-id',
        purpose: SmbSharePurpose.MultiProtocolShare,
      }]);

      nameAndOptionsForm.controls.share_type.setValue(DatasetPreset.Generic);
    });

    it('skips creation new SMB and NFS when checkboxes are set to false', () => {
      datasetPresetForm.controls.create_smb.setValue(false);
      datasetPresetForm.controls.create_nfs.setValue(false);

      jest.spyOn(spectator.inject(Store), 'dispatch');
      clickSave();

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('sharing.smb.create', [{
        name: 'new_sbm_name',
        path: '/mnt/saved-id',
      }]);

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('sharing.nfs.create', [{
        path: '/mnt/saved-id',
      }]);

      expect(spectator.inject(Store).dispatch).not.toHaveBeenCalledWith(
        checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }),
      );
      expect(spectator.inject(Store).dispatch).not.toHaveBeenCalledWith(
        checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }),
      );
    });

    it('creates a new dataset when new form is submitted', () => {
      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);

      clickSave();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.dataset.create', [{
        name: 'dataset',
        encryption: true,
        aclmode: AclMode.Passthrough,
      }]);
      // The panel closes with the saved record — the dataset list needs it to switch to the new dataset.
      expect(closed).toHaveBeenCalledWith(expect.objectContaining({ id: 'saved-id' }));
    });

    it('creates a new dataset in advanced mode when new form is submitted', () => {
      toggleAdvanced();
      clickSave();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.dataset.create', [{
        name: 'dataset',
        encryption: true,
        refquota: GiB,
        aclmode: AclMode.Passthrough,
      }]);
    });

    it('checks if parent has ACL and goes to the ACL editor once the panel has closed', () => {
      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);

      clickSave();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('filesystem.stat', ['/mnt/parent']);
      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: helptextDatasetForm.afterSubmitDialog.title,
          message: helptextDatasetForm.afterSubmitDialog.message,
        }),
      );
      // Record handed back first, so the opener still sees it before navigation tears the panel down.
      expect(closed).toHaveBeenCalledWith(expect.objectContaining({ id: 'saved-id' }));
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(
        ['/', 'datasets', 'acl', 'edit'],
        { queryParams: { path: '/mnt/saved-id' } },
      );
    });
  });

  describe('fourth checks', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { params: { datasetId: 'parent/child', isNew: false } } });
    });

    it('updates an existing child dataset when edit form is submitted', () => {
      clickSave();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.dataset.update', ['parent/child', {
        name: 'dataset',
        aclmode: AclMode.Passthrough,
      }]);
    });
  });

  describe('fifth checks', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { params: { datasetId: 'parent', isNew: false } } });
    });

    it('updates an existing root dataset when edit form is submitted', () => {
      clickSave();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.dataset.update', ['parent', {
        name: 'dataset',
        aclmode: AclMode.Passthrough,
      }]);
    });
  });
});

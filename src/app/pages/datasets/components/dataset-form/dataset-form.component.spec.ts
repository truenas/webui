import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonHarness, TnIconTesting, TnMenuTesting } from '@truenas/ui-components';
import { MockComponents, MockInstance } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';
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
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import {
  FormSidePanelContainerComponent, SidePanelFooterAction,
} from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
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
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
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
        mockCall('pool.dataset.create', { id: 'saved-id', name: 'parent/saved-child', mountpoint: '/mnt/saved-id' } as Dataset),
        mockCall('pool.dataset.update', { id: 'saved-id', name: 'parent/saved-child', mountpoint: '/mnt/saved-id' } as Dataset),
        mockCall('filesystem.stat', { acl: true } as FileSystemStat),
      ]),
      ...ixFormTestingProviders(),
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
  const save = (): void => spectator.component.submit();
  const advancedAction = (): SidePanelFooterAction => {
    return spectator.component.footerActions.find((action) => action.testId === 'toggle-advanced')!;
  };
  const toggleAdvanced = (): void => {
    advancedAction().onClick();
    spectator.detectChanges();
  };

  describe('first checks', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { params: { datasetId: 'dataset', isNew: true } } });
    });

    it('toggles between Advanced mode from the panel footer action', () => {
      expect(spectator.query(OtherOptionsSectionComponent)!.advancedMode).toBe(false);
      expect(spectator.query(QuotasSectionComponent)).not.toExist();
      expect(advancedAction().label).toBe('Advanced Options');

      toggleAdvanced();

      expect(spectator.query(OtherOptionsSectionComponent)!.advancedMode).toBe(true);
      expect(spectator.query(QuotasSectionComponent)).toExist();
      expect(advancedAction().label).toBe('Basic Options');

      toggleAdvanced();

      expect(spectator.query(OtherOptionsSectionComponent)!.advancedMode).toBe(false);
      expect(spectator.query(QuotasSectionComponent)).not.toExist();
    });

    it('stops gating Save on a section the Basic Options toggle unmounted', () => {
      toggleAdvanced();

      spectator.query(QuotasSectionComponent)!.formValidityChange.emit(false);
      spectator.detectChanges();

      expect(spectator.component.canSubmit()).toBe(false);

      // The `false` above is the last thing that instance emits. Once it's off screen it must stop
      // blocking Save, or the panel is wedged with nothing left for the user to fix.
      toggleAdvanced();

      expect(spectator.query(QuotasSectionComponent)).not.toExist();
      expect(spectator.component.canSubmit()).toBe(true);
    });

    it('takes a re-mounted section back into the Save gate on its own report', () => {
      toggleAdvanced();
      spectator.query(QuotasSectionComponent)!.formValidityChange.emit(false);
      toggleAdvanced();
      toggleAdvanced();

      // The remount itself must not carry the previous instance's `false` back in: the gate is
      // cleared on the way out, so a fresh section starts from "nothing to fix" and its own on-mount
      // report agrees with what the host already believes (a report that disagreed mid-pass would be
      // NG0100).
      expect(spectator.component.canSubmit()).toBe(true);

      // The real section reports its current validity on mount (see QuotasSectionComponent); the
      // mocked one here doesn't, so the emission stands in for it.
      spectator.query(QuotasSectionComponent)!.formValidityChange.emit(true);
      spectator.detectChanges();

      expect(spectator.component.canSubmit()).toBe(true);

      spectator.query(QuotasSectionComponent)!.formValidityChange.emit(false);
      spectator.detectChanges();

      expect(spectator.component.canSubmit()).toBe(false);
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
      save();

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

      save();

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
      save();

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

    it('maps a failed save onto the sections that own the fields', () => {
      const error = new Error('dataset already exists');
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(throwError(() => error));

      save();

      // `<ix-form>`'s own [formGroup] here is the empty root, so left to itself the handler would
      // find no control for any field. The sections' groups are what a backend validation error has
      // to be resolved against.
      expect(spectator.inject(FormErrorHandlerService).handleValidationErrors).toHaveBeenCalledWith(
        error,
        expect.arrayContaining([nameAndOptionsForm, datasetPresetForm]),
      );
    });

    it('keeps Save disabled while a sub-section reports itself invalid', () => {
      // The root FormGroup is empty (and so always VALID) — sub-section validity reaches the
      // host-owned Save only through `<ix-form>`'s [extraDisabled] binding.
      expect(spectator.component.canSubmit()).toBe(true);

      spectator.query(EncryptionSectionComponent)!.formValidityChange.emit(false);
      spectator.detectChanges();

      expect(spectator.component.canSubmit()).toBe(false);

      spectator.query(EncryptionSectionComponent)!.formValidityChange.emit(true);
      spectator.detectChanges();

      expect(spectator.component.canSubmit()).toBe(true);
    });

    it('creates a new dataset when new form is submitted', () => {
      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);

      save();

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
      save();

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

      save();

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
      // Deliberately silent on this branch — we're navigating away, so a snackbar would be noise.
      expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalled();
    });
  });

  describe('success messages', () => {
    // These snackbars are the ONLY confirmation a save produces, and they are built from the saved
    // record by `successMessage`'s function form.
    // Declining the ACL prompt keeps us off the navigate-away branch, which is deliberately silent.
    const declineAclPrompt = [mockProvider(DialogService, { confirm: jest.fn(() => of(false)) })];

    it('announces the created dataset', () => {
      spectator = createComponent({
        props: { params: { datasetId: 'parent', isNew: true } },
        providers: declineAclPrompt,
      });

      save();

      expect(spectator.inject(SnackbarService).success)
        .toHaveBeenCalledWith('Dataset «saved-child» created.');
    });

    it('announces the updated dataset', () => {
      spectator = createComponent({
        props: { params: { datasetId: 'parent/child', isNew: false } },
        providers: declineAclPrompt,
      });

      save();

      expect(spectator.inject(SnackbarService).success)
        .toHaveBeenCalledWith('Dataset «saved-child» updated.');
    });
  });

  describe('fourth checks', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { params: { datasetId: 'parent/child', isNew: false } } });
    });

    it('opens in advanced mode and offers no toggle back — basic edit mode has nothing but the disabled Name field', () => {
      expect(spectator.query(OtherOptionsSectionComponent)!.advancedMode).toBe(true);
      expect(spectator.component.footerActions).toEqual([]);
    });

    it('hands the saved dataset back to the opener', () => {
      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);

      save();

      expect(closed).toHaveBeenCalledWith(expect.objectContaining({ id: 'saved-id' }));
    });

    it('updates an existing child dataset when edit form is submitted', () => {
      save();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.dataset.update', ['parent/child', {
        name: 'dataset',
        aclmode: AclMode.Passthrough,
      }]);
    });
  });

  describe('edit mode while the dataset is still loading', () => {
    it('never mounts the create-only sections', () => {
      // `isNew` comes from the host params, not `!existingDataset()`: the latter reads as "new"
      // for the whole load, so both create-only sections would mount and immediately tear down —
      // and their parting `formValidityChange` emissions would linger in the Save gate.
      const load$ = new Subject<Dataset>();
      spectator = createComponent({
        props: { params: { datasetId: 'parent/child', isNew: false } },
        providers: [
          mockProvider(DatasetFormService, {
            checkAndWarnForLengthAndDepth: jest.fn(() => of(true)),
            loadDataset: jest.fn(() => load$),
          }),
        ],
      });

      expect(spectator.query(EncryptionSectionComponent)).toBeNull();
      expect(spectator.query(QuotasSectionComponent)).toBeNull();

      load$.next(existingDataset);
      load$.complete();
      spectator.detectChanges();

      expect(spectator.query(EncryptionSectionComponent)).toBeNull();
      expect(spectator.query(QuotasSectionComponent)).toBeNull();
    });

    it('keeps Save disabled when the edit load fails, so an edit cannot fall through to a create', () => {
      spectator = createComponent({
        props: { params: { datasetId: 'parent/child', isNew: false } },
        providers: [
          mockProvider(DatasetFormService, {
            checkAndWarnForLengthAndDepth: jest.fn(() => of(true)),
            loadDataset: jest.fn(() => throwError(() => new Error('Failed to load dataset'))),
          }),
          mockProvider(ErrorHandlerService),
        ],
      });

      // The Name field stays enabled while `existing` is unset, so without this gate the user could
      // fill the form in and submit a create payload rooted at the pool from an edit panel.
      expect(spectator.component.canSubmit()).toBe(false);

      save();

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('pool.dataset.create', expect.anything());
    });
  });

  describe('create mode when the parent fails to load', () => {
    it('keeps Save disabled, so nothing is filed under an unknown parent', () => {
      spectator = createComponent({
        props: { params: { datasetId: 'parent', isNew: true } },
        providers: [
          mockProvider(DatasetFormService, {
            checkAndWarnForLengthAndDepth: jest.fn(() => of(true)),
            loadDataset: jest.fn(() => throwError(() => new Error('Failed to load dataset'))),
          }),
          mockProvider(ErrorHandlerService),
        ],
      });

      // A create is filed as `${parent.name}/${name}`, so without the parent the payload would ask
      // the backend for `undefined/my-dataset`.
      expect(spectator.component.canSubmit()).toBe(false);

      save();

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('pool.dataset.create', expect.anything());
    });
  });

  describe('unsaved changes', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { params: { datasetId: 'dataset', isNew: true } } });
      nameAndOptionsForm.markAsPristine();
      datasetPresetForm.markAsPristine();
    });

    it('counts the share-preset group, which is a sibling of the section form', () => {
      expect(spectator.component.hasUnsavedChanges()).toBe(false);

      datasetPresetForm.controls.create_smb.markAsDirty();

      expect(spectator.component.hasUnsavedChanges()).toBe(true);
    });
  });

  describe('fifth checks', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { params: { datasetId: 'parent', isNew: false } } });
    });

    it('updates an existing root dataset when edit form is submitted', () => {
      save();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.dataset.update', ['parent', {
        name: 'dataset',
        aclmode: AclMode.Passthrough,
      }]);
    });
  });
});

/**
 * The specs above drive the form directly. This one portals it into the real
 * `FormSidePanelContainerComponent` instead, so the form's own `footerActions` and `requiredRoles`
 * are proven to reach an actual panel footer — the container spec otherwise only exercises that
 * wiring against its own test doubles.
 */
describe('DatasetFormComponent hosted in the side panel', () => {
  let fixture: ComponentFixture<FormSidePanelContainerComponent>;
  const parentDataset = { id: 'parent' } as Dataset;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [FormSidePanelContainerComponent, TranslateModule.forRoot()],
      providers: [
        mockApi([
          mockCall('pool.dataset.create', { id: 'saved-id', name: 'parent/saved-child', mountpoint: '/mnt/saved-id' } as Dataset),
          mockCall('filesystem.stat', { acl: false } as FileSystemStat),
        ]),
        ...ixFormTestingProviders(),
        mockProvider(DialogService, { confirm: jest.fn(() => of(false)) }),
        mockProvider(DatasetFormService, {
          checkAndWarnForLengthAndDepth: jest.fn(() => of(true)),
          loadDataset: jest.fn(() => of(parentDataset)),
        }),
        mockProvider(Router),
        mockProvider(FilesystemService),
        provideMockStore(),
        mockAuth(),
        { provide: UnsavedChangesService, useValue: { showConfirmDialog: jest.fn(() => of(true)) } },
        ...TnIconTesting.jest.providers(),
      ],
    });
    // Keep the real template (its `viewChild.required` section queries must resolve) and swap only
    // the heavy section components for mocks — the same ones the specs above use.
    TestBed.overrideComponent(DatasetFormComponent, {
      remove: {
        imports: [
          NameAndOptionsSectionComponent,
          EncryptionSectionComponent,
          QuotasSectionComponent,
          OtherOptionsSectionComponent,
        ],
      },
      add: {
        imports: MockComponents(
          NameAndOptionsSectionComponent,
          EncryptionSectionComponent,
          QuotasSectionComponent,
          OtherOptionsSectionComponent,
        ),
      },
    });

    fixture = TestBed.createComponent(FormSidePanelContainerComponent);
    fixture.componentRef.setInput('portal', new ComponentPortal(DatasetFormComponent));
    fixture.componentRef.setInput('formInputs', { params: { datasetId: 'parent', isNew: true } });
    // A panel without a title has no accessible name, which the library warns about in
    // dev mode; production callers always pass one.
    fixture.componentRef.setInput('title', 'Add Dataset');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("renders the form's own Advanced Options footer action alongside the host Save", async () => {
    const loader = TnMenuTesting.rootLoader(fixture);

    expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Advanced Options' }))).not.toBeNull();
    expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Save' }))).not.toBeNull();
  });

  it("gates the host Save on the form's requiredRoles", () => {
    // DatasetWrite is held here (mockAuth grants everything), so Save renders unwrapped.
    expect(document.querySelector('ix-missing-access-wrapper')).toBeNull();
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  ChangeDetectionStrategy, Component, inject, input, OnChanges,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  createRoutingFactory, mockProvider, SpectatorRouting,
} from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { TnButtonHarness, TnDialog } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { firstValueFrom, of } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { NfsAclTag, NfsAclType, NfsBasicPermission } from 'app/enums/nfs-acl.enum';
import { NfsAcl, NfsAclItem } from 'app/interfaces/acl.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxGroupComboboxComponent } from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-group-combobox.component';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-user-combobox.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import {
  AclEditorListComponent,
} from 'app/pages/datasets/modules/permissions/components/acl-editor-list/acl-editor-list.component';
import {
  EditNfsAceComponent,
} from 'app/pages/datasets/modules/permissions/components/edit-nfs-ace/edit-nfs-ace.component';
import {
  EditPosixAceComponent,
} from 'app/pages/datasets/modules/permissions/components/edit-posix-ace/edit-posix-ace.component';
import {
  PermissionsItemComponent,
} from 'app/pages/datasets/modules/permissions/components/permissions-item/permissions-item.component';
import { SaveAsPresetModalComponent } from 'app/pages/datasets/modules/permissions/components/save-as-preset-modal/save-as-preset-modal.component';
import {
  SelectPresetModalComponent,
} from 'app/pages/datasets/modules/permissions/components/select-preset-modal/select-preset-modal.component';
import {
  StripAclModalComponent,
} from 'app/pages/datasets/modules/permissions/components/strip-acl-modal/strip-acl-modal.component';
import {
  AclEditorSaveControlsComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/acl-editor-save-controls/acl-editor-save-controls.component';
import {
  DatasetAclEditorComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/dataset-acl-editor.component';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { StorageService } from 'app/services/storage.service';
import { UserService } from 'app/services/user.service';

/**
 * Stands in for the NFS entry form where its timing matters: like the real one, it reports the
 * selected entry's validity to the store from ngOnChanges, part-way through the editor's render.
 */
@Component({
  selector: 'ix-edit-nfs-ace',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ValidatingNfsAceStubComponent implements OnChanges {
  readonly ace = input.required<NfsAclItem>();
  private store = inject(DatasetAclEditorStore);

  ngOnChanges(): void {
    this.store.updateSelectedAceValidation(Boolean(this.ace().who));
  }
}

describe('DatasetAclEditorComponent', () => {
  let spectator: SpectatorRouting<DatasetAclEditorComponent>;
  let api: MockTypedApiService;
  let tnDialog: TnDialog;
  let loader: HarnessLoader;
  const acl = {
    acltype: AclType.Nfs4,
    trivial: false,
    acl: [
      {
        who: 'john',
        tag: NfsAclTag.User,
        type: NfsAclType.Allow,
        perms: {
          BASIC: NfsBasicPermission.Modify,
        },
      },
      {
        tag: NfsAclTag.Owner,
        type: NfsAclType.Allow,
        perms: {
          BASIC: NfsBasicPermission.Read,
        },
      },
      {
        tag: NfsAclTag.Everyone,
        type: NfsAclType.Deny,
        perms: {
          BASIC: NfsBasicPermission.Read,
        },
      },
    ],
  } as NfsAcl;

  const providers = [
    StorageService,
    DatasetAclEditorStore,
    mockProvider(DialogService),
    mockTypedApi([
      mockTypedCall('filesystem.getacl', acl as unknown as CallResponse<WebUiApiDirectory, 'filesystem.getacl'>),
      mockTypedCall('filesystem.stat', {
        user: 'john',
        group: 'johns',
      } as CallResponse<WebUiApiDirectory, 'filesystem.stat'>),
      mockTypedJob('filesystem.setacl', { state: JobState.Success }),
    ]),
    mockProvider(UserService, {
      userQueryDsCache: () => of(),
      groupQueryDsCache: () => of(),
    }),
    mockProvider(TnDialog, {
      open: jest.fn(() => ({
        closed: of({ wasStripped: true }),
      })),
    }),
    mockAuth(),
    mockProvider(UnsavedChangesService, {
      showConfirmDialog: jest.fn(() => of(true)),
    }),
  ];

  const createComponent = createRoutingFactory({
    component: DatasetAclEditorComponent,
    imports: [
      CastPipe,
      ReactiveFormsModule,
    ],
    declarations: [
      // Mocked, as the ix-* wrappers they replaced were: this suite is about the ACL
      // editor, and rendering real directory-backed pickers only adds their own
      // dependencies to it.
      MockComponent(IxUserComboboxComponent),
      MockComponent(IxGroupComboboxComponent),
      MockComponent(EditPosixAceComponent),
      MockComponent(EditNfsAceComponent),
      MockComponent(AclEditorSaveControlsComponent),
      AclEditorListComponent,
      PermissionsItemComponent,
    ],
    providers,
    queryParams: {
      path: '/mnt/pool/dataset',
    },
  });

  describe('empty return URL', () => {
    beforeEach(async () => {
      spectator = createComponent();
      api = spectator.inject(MockTypedApiService);
      tnDialog = spectator.inject(TnDialog);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      jest.spyOn(spectator.inject(Router), 'navigate').mockResolvedValue(true);
      await spectator.fixture.whenStable();
      spectator.detectChanges();
    });

    it('sets returnUrl to null when not provided', () => {
      const store = spectator.inject(DatasetAclEditorStore);
      expect(store.state().returnUrl).toBeNull();
    });

    describe('preset modal', () => {
      it('shows select preset modal if user presses "Use Preset"', async () => {
        const usePresetButton = await loader.getHarness(TnButtonHarness.with({ label: 'Use Preset' }));
        await usePresetButton.click();

        expect(tnDialog.open).toHaveBeenCalledWith(
          SelectPresetModalComponent,
          { data: { allowCustom: false, datasetPath: '/mnt/pool/dataset' } },
        );
      });

      it('shows save as preset modal if user presses "Save As Preset"', async () => {
        const saveAsPresetButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save As Preset' }));
        await saveAsPresetButton.click();

        expect(tnDialog.open).toHaveBeenCalledWith(
          SaveAsPresetModalComponent,
          { data: { aclType: AclType.Nfs4, datasetPath: '/mnt/pool/dataset' } },
        );
      });
    });

    describe('loading and layout', () => {
      it('loads acl and stats for the dataset specified', () => {
        expect(api.call).toHaveBeenCalledWith('filesystem.getacl', ['/mnt/pool/dataset', true, true]);
        expect(api.call).toHaveBeenCalledWith('filesystem.stat', ['/mnt/pool/dataset']);
      });

      it('shows loaded acl', () => {
        const items = spectator.queryAll('ix-permissions-item');
        expect(items).toHaveLength(3);

        expect(items[0]).toHaveText('User - john');
        expect(items[0]).toHaveText('Allow | Modify');
        expect(items[1]).toHaveText('owner@ - john');
        expect(items[1]).toHaveText('Allow | Read');
        expect(items[2]).toHaveText('everyone@');
        expect(items[2]).toHaveText('Deny | Read');
      });

      it('shows form for appropriate ace selected', () => {
        const form = spectator.query(EditNfsAceComponent)!;

        expect(form).toExist();
        // The fake client answers with a copy of the fixture, so identity is checked against what the store
        // loaded: the form must edit that entry, not a copy of it.
        expect(form.ace).toBe(spectator.inject(DatasetAclEditorStore).state().acl.acl[0]);
        expect(form.ace).toEqual(acl.acl[0]);
      });
    });

    describe('editing', () => {
      it('opens Strip ACL dialog when Strip Acl is pressed', async () => {
        const stripButton = await loader.getHarness(TnButtonHarness.with({ label: 'Strip ACL' }));
        await stripButton.click();

        expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(StripAclModalComponent, {
          data: { path: '/mnt/pool/dataset' },
        });
      });

      it('navigates after stripping the ACL - no returnUrl', () => {
        const router = spectator.inject(Router);
        spectator.component.onStripAclPressed();

        expect(router.navigate).toHaveBeenCalledWith(['/datasets', '/mnt/pool/dataset']);
      });

      it('navigates to dataset page when Cancel is pressed without returnUrl', async () => {
        const cancelButton = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
        await cancelButton.click();

        expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/datasets', '/mnt/pool/dataset']);
      });

      it('skips unsaved changes dialog when Cancel is pressed with dirty form', async () => {
        spectator.component.onAddItemPressed();
        spectator.detectChanges();

        const cancelButton = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
        await cancelButton.click();

        const result = await firstValueFrom(spectator.component.canDeactivate());
        expect(result).toBe(true);
        expect(spectator.inject(UnsavedChangesService).showConfirmDialog).not.toHaveBeenCalled();
      });

      it('resets skipDeactivateCheck when navigation fails after Cancel', async () => {
        spectator.component.onAddItemPressed();
        spectator.detectChanges();

        const router = spectator.inject(Router);
        jest.spyOn(router, 'navigate').mockResolvedValue(false);

        spectator.component.onCancel();
        await Promise.resolve();

        await firstValueFrom(spectator.component.canDeactivate());
        expect(spectator.inject(UnsavedChangesService).showConfirmDialog).toHaveBeenCalled();
      });

      it('adds another ace when Add item is pressed', async () => {
        const addAceButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add Item' }));
        await addAceButton.click();

        const items = spectator.queryAll('ix-permissions-item');
        expect(items).toHaveLength(4);
        expect(items[3]).toHaveText('User - ?');
        expect(items[3]).toHaveText('Allow | Modify');
      });
    });

    describe('saving', () => {
      it('renders save controls', () => {
        expect(spectator.query(AclEditorSaveControlsComponent)).toExist();
      });
    });

    describe('canDeactivate', () => {
      it('allows deactivation when no changes were made', async () => {
        const result = await firstValueFrom(spectator.component.canDeactivate());
        expect(result).toBe(true);
      });

      it('shows confirm dialog when ACL has been modified', async () => {
        spectator.component.onAddItemPressed();
        spectator.detectChanges();

        await firstValueFrom(spectator.component.canDeactivate());
        expect(spectator.inject(UnsavedChangesService).showConfirmDialog).toHaveBeenCalled();
      });

      it('allows deactivation after save has been completed', async () => {
        spectator.component.onAddItemPressed();
        spectator.detectChanges();

        spectator.inject(DatasetAclEditorStore).saveSucceeded$.next();

        const result = await firstValueFrom(spectator.component.canDeactivate());
        expect(result).toBe(true);
      });
    });
  });

  describe('homeShare query param', () => {
    it('does not load home share preset when homeShare is false', () => {
      spectator = createComponent({
        detectChanges: false,
        queryParams: {
          path: '/mnt/pool/dataset',
          homeShare: 'false',
        },
      });
      const store = spectator.inject(DatasetAclEditorStore);
      jest.spyOn(store, 'loadHomeSharePreset');

      spectator.detectChanges();

      expect(store.loadHomeSharePreset).not.toHaveBeenCalled();
    });

    it('loads home share preset when homeShare is true', async () => {
      spectator = createComponent({
        detectChanges: false,
        queryParams: {
          path: '/mnt/pool/dataset',
          homeShare: 'true',
        },
      });
      const store = spectator.inject(DatasetAclEditorStore);
      // Only the trigger is under test; loading the preset itself is covered in the store spec.
      jest.spyOn(store, 'loadHomeSharePreset').mockImplementation();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(store.loadHomeSharePreset).toHaveBeenCalled();
    });
  });

  describe('return URL navigation', () => {
    beforeEach(() => {
      spectator = createComponent({
        queryParams: {
          path: '/mnt/pool/dataset',
          returnUrl: '/sharing',
        },
      });
    });

    it('sets returnUrl from query params when provided', () => {
      const store = spectator.inject(DatasetAclEditorStore);
      expect(store.state().returnUrl).toBe('/sharing');
    });

    it('navigates after stripping the ACL - with returnUrl', () => {
      const router = spectator.inject(Router);
      spectator.component.onStripAclPressed();

      expect(router.navigate).toHaveBeenCalledWith(['/sharing']);
    });

    it('navigates to returnUrl when Cancel is pressed', async () => {
      jest.spyOn(spectator.inject(Router), 'navigate').mockResolvedValue(true);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const cancelButton = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
      await cancelButton.click();

      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/sharing']);
    });
  });

  describe('an entry form that validates while the editor renders', () => {
    const createValidatingComponent = createRoutingFactory({
      component: DatasetAclEditorComponent,
      imports: [
        CastPipe,
        ReactiveFormsModule,
      ],
      declarations: [
        MockComponent(IxUserComboboxComponent),
        MockComponent(IxGroupComboboxComponent),
        MockComponent(EditPosixAceComponent),
        AclEditorListComponent,
        PermissionsItemComponent,
      ],
      overrideComponents: [
        [
          DatasetAclEditorComponent,
          {
            remove: { imports: [EditNfsAceComponent] },
            add: { imports: [ValidatingNfsAceStubComponent] },
          },
        ],
      ],
      providers,
      queryParams: {
        path: '/mnt/pool/dataset',
      },
    });

    beforeEach(async () => {
      spectator = createValidatingComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();
      spectator.detectChanges();
    });

    it('marks a new entry invalid and disables Save as soon as Add Item is pressed', async () => {
      const addAceButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add Item' }));
      expect(spectator.query('.save-button button')).not.toBeDisabled();

      await addAceButton.click();

      // Read from the DOM rather than through a harness: a harness runs change detection
      // again before it reads, which is the extra event this used to wait for.
      const rows = spectator.queryAll('ix-acl-editor-list .ace');
      expect(rows).toHaveLength(4);
      expect(rows[3]).toHaveDescendant('.warning');
      expect(spectator.query('.save-button button')).toBeDisabled();
    });
  });
});

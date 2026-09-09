import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnCheckboxHarness, TnChipInputHarness, TnDialog, TnFormFieldHarness, TnFormListHarness, TnInputHarness,
  TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  S3Access, S3MultipartEtag, S3ObjectLockMode, S3PermissionsModel, S3PrincipalType, S3Versioning,
} from 'app/enums/s3.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { Group } from 'app/interfaces/group.interface';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { User } from 'app/interfaces/user.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { IxUserComboboxHarness } from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { ApiService } from 'app/modules/websocket/api.service';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectServices } from 'app/store/services/services.selectors';
import { selectLicense } from 'app/store/system-info/system-info.selectors';

describe('S3BucketFormComponent', () => {
  let spectator: Spectator<S3BucketFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let api: ApiService;
  let store$: Store<AppState>;

  const existingBucket = {
    id: 7,
    name: 'photos',
    dataset: 'tank/buckets/photos',
    owner: 'alice',
    enabled: true,
    permissions_model: S3PermissionsModel.S3,
    grants: [
      {
        principal_type: S3PrincipalType.Group, xid: 1001, name: 'staff', access: S3Access.ReadWrite,
      },
    ],
    versioning: S3Versioning.Enabled,
    snapshot_versions: ['auto-*'],
    snapshot_versions_max: 64,
    multipart_etag: S3MultipartEtag.Composite,
    object_lock: false,
    object_lock_default_mode: null,
    object_lock_default_days: null,
    audit: null,
    audit_overflow: null,
    locked: false,
  } as S3Bucket;

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  // `ix-user-combobox` is its own CVA, so `IxFormHarness` — which indexes ix-* controls and
  // `tn-form-field`s — does not reach it. Drive it through its own harness.
  const setOwner = async (username: string): Promise<void> => {
    const owner = await loader.getHarness(IxUserComboboxHarness);
    await owner.focus();
    await owner.selectOption(username);
  };
  // The Advanced/Basic toggle is rendered by the side-panel host from `footerActions`.
  const clickAdvancedOptions = async (): Promise<void> => {
    const [toggleAdvanced] = spectator.component.footerActions;
    expect(toggleAdvanced.label).toBe('Advanced Options');
    toggleAdvanced.onClick();
    spectator.detectChanges();
    await spectator.fixture.whenStable();
  };

  const createComponent = createComponentFactory({
    component: S3BucketFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockApi([
        mockCall('sharing.s3.create'),
        mockCall('sharing.s3.update'),
        mockCall('sharing.s3.audit_choices', { GetObject: 'GetObject', PutObject: 'PutObject' }),
        mockCall('pool.filesystem_choices', ['tank', 'tank/buckets', 'tank/buckets/photos']),
        mockCall('user.query', [
          { username: 'alice', uid: 1000 },
          { username: 'bob', uid: 1001 },
        ] as User[]),
        mockCall('group.query', [{ group: 'staff', gid: 1001 }] as Group[]),
      ]),
      mockAuth(),
      mockProvider(DatasetService, {
        getDatasetNodeProvider: () => () => of([]),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({ closed: of(true) })),
      }),
      provideMockStore({
        selectors: [
          { selector: selectServices, value: [] },
          { selector: selectLicense, value: null },
        ],
      }),
      ...ixFormTestingProviders(),
    ],
  });

  describe('creating a bucket', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
      store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');
    });

    it('shows object lock with the basic fields and the rest only after Advanced Options is pressed', async () => {
      expect(await loader.hasHarness(TnCheckboxHarness.with({ label: 'Enable Object Lock' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Permissions Model' }))).toBe(false);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Versioning' }))).toBe(false);

      await clickAdvancedOptions();

      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Permissions Model' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Versioning' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Multipart ETag' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Audit' }))).toBe(false);
    });

    it('turns versioning on and defaults to Compliance retention when object lock is enabled', async () => {
      await clickAdvancedOptions();
      expect(await (await getSelect('versioning')).getDisplayText()).toBe('Off');

      await (await getCheckbox('object_lock')).check();

      const versioning = await getSelect('versioning');
      expect(await versioning.getDisplayText()).toBe('Enabled');
      expect(await versioning.isDisabled()).toBe(true);
      expect(await (await getSelect('object_lock_default_mode')).getDisplayText()).toBe('Compliance');

      await (await getCheckbox('object_lock')).uncheck();
      const released = await getSelect('versioning');
      expect(await released.isDisabled()).toBe(false);
      expect(await released.getDisplayText()).toBe('Off');
    });

    it('creates a bucket with object lock, versioning and the Compliance default rule', async () => {
      await (await getInput('name')).setValue('backups');
      await form.fillForm({
        'Parent Dataset': 'tank',
      });
      await setOwner('alice');
      await (await getCheckbox('object_lock')).check();
      await (await getInput('object_lock_default_days')).setValue('30');

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.create', [expect.objectContaining({
        versioning: S3Versioning.Enabled,
        object_lock: true,
        object_lock_default_mode: S3ObjectLockMode.Compliance,
        object_lock_default_days: 30,
      })]);
    });

    it('keeps a "no default rule" chosen in this session when object lock is re-checked', async () => {
      await (await getCheckbox('object_lock')).check();
      await (await getSelect('object_lock_default_mode')).selectOption('No default rule');
      await (await getCheckbox('object_lock')).uncheck();
      await (await getCheckbox('object_lock')).check();

      expect(spectator.component.form.controls.object_lock_default_mode.value).toBeNull();
    });

    it('does not leave versioning on after object lock is checked and unchecked in basic mode', async () => {
      await (await getInput('name')).setValue('plain');
      await form.fillForm({
        'Parent Dataset': 'tank',
      });
      await setOwner('alice');
      await (await getCheckbox('object_lock')).check();
      await (await getCheckbox('object_lock')).uncheck();

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.create', [expect.objectContaining({
        versioning: S3Versioning.Off,
        object_lock: false,
      })]);
    });

    it('does not offer object lock with the Multiprotocol permissions model', async () => {
      await clickAdvancedOptions();
      await (await getSelect('permissions_model')).selectOption('Multiprotocol');

      const objectLock = await getCheckbox('object_lock');
      expect(await objectLock.isDisabled()).toBe(true);
      expect(await objectLock.isChecked()).toBe(false);
    });

    it('rejects the /mnt root as a parent dataset', async () => {
      await (await getInput('name')).setValue('photos');
      await form.fillForm({
        'Parent Dataset': '/mnt',
      });
      await setOwner('alice');

      expect(spectator.component.canSubmit()).toBe(false);
      expect(spectator.component.form.controls.parent_dataset.errors).toMatchObject({
        customValidator: { message: 'Select a pool or dataset. The /mnt directory itself is not a dataset.' },
      });
    });

    it('rejects a bucket whose dataset already exists under the parent', async () => {
      await (await getInput('name')).setValue('photos');
      await form.fillForm({
        'Parent Dataset': 'tank/buckets',
      });
      await setOwner('alice');

      expect(spectator.component.canSubmit()).toBe(false);
      expect(spectator.component.form.controls.name.errors).toMatchObject({
        customValidator: { message: 'A dataset with this name already exists under the selected parent dataset.' },
      });

      await (await getInput('name')).setValue('videos');
      expect(spectator.component.canSubmit()).toBe(true);
    });

    it('creates a bucket under the chosen parent dataset', async () => {
      await (await getInput('name')).setValue('videos');
      await form.fillForm({
        'Parent Dataset': 'tank/buckets',
      });
      await setOwner('alice');

      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);
      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.create', [{
        name: 'videos',
        dataset: 'tank/buckets/videos',
        owner: 'alice',
        enabled: true,
        permissions_model: S3PermissionsModel.BucketOwnerEnforced,
        grants: [],
        versioning: S3Versioning.Off,
        snapshot_versions: [],
        snapshot_versions_max: 64,
        multipart_etag: S3MultipartEtag.Composite,
        object_lock: false,
        object_lock_default_mode: null,
        object_lock_default_days: null,
      }]);
      expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.S3 }));
      expect(closed).toHaveBeenCalledWith(true);
    });

    it('adds grants in advanced mode', async () => {
      await (await getInput('name')).setValue('shared');
      await form.fillForm({
        'Parent Dataset': 'tank',
      });
      await setOwner('alice');

      await clickAdvancedOptions();

      const grants = await loader.getHarness(TnFormListHarness.with({ label: 'Grants' }));
      await grants.add();
      await (await getSelect('principal_type')).selectOption('Everyone');
      await (await getSelect('access')).selectOption('Read Only');

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.create', [expect.objectContaining({
        dataset: 'tank/shared',
        grants: [{ principal_type: S3PrincipalType.Everyone, xid: null, access: S3Access.ReadOnly }],
      })]);
    });
  });

  describe('editing a bucket', () => {
    beforeEach(async () => {
      spectator = createComponent({ props: { bucket: existingBucket } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('shows existing values with the dataset read only', async () => {
      await clickAdvancedOptions();

      expect(await (await getInput('name')).getValue()).toBe('photos');
      const dataset = await loader.getHarness(TnInputHarness.with({ name: 'dataset' }));
      expect(await dataset.getValue()).toBe('tank/buckets/photos');
      expect(await dataset.isDisabled()).toBe(true);
      expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);
      expect(await (await getSelect('permissions_model')).getDisplayText()).toBe('S3 Only');
      expect(await (await getSelect('versioning')).getDisplayText()).toBe('Enabled');
      const snapshotVersions = await loader.getHarness(
        TnChipInputHarness.with({ testId: 'chip-input-snapshot-versions' }),
      );
      expect(await snapshotVersions.getChips()).toEqual(['auto-*']);
      expect(await (await getSelect('principal_type')).getDisplayText()).toBe('Group');
      expect(await (await getSelect('access')).getDisplayText()).toBe('Read / Write');
    });

    it('keeps a stored "no default rule" when object lock is unchecked and re-checked', async () => {
      spectator = createComponent({
        props: { bucket: { ...existingBucket, object_lock: true, object_lock_default_mode: null } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      await (await getCheckbox('object_lock')).uncheck();
      await (await getCheckbox('object_lock')).check();

      expect(spectator.component.form.controls.object_lock_default_mode.value).toBeNull();
    });

    it('lets an EVERYONE grant be switched to a user grant', async () => {
      spectator = createComponent({
        props: {
          bucket: {
            ...existingBucket,
            grants: [{
              principal_type: S3PrincipalType.Everyone, xid: null, name: '', access: S3Access.ReadOnly,
            }],
          },
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await clickAdvancedOptions();

      const xid = spectator.component.form.controls.grants.at(0).controls.xid;
      expect(xid.disabled).toBe(true);

      await (await getSelect('principal_type')).selectOption('User');

      expect(xid.enabled).toBe(true);
      expect(spectator.component.canSubmit()).toBe(false);
    });

    it('requires retention days once object lock is on with a default retention mode', async () => {
      await (await getCheckbox('object_lock')).check();

      expect(spectator.component.form.controls.object_lock_default_days.errors).toMatchObject({ required: true });
      expect(spectator.component.canSubmit()).toBe(false);
    });

    it('stops requiring retention days once object lock is turned off again', async () => {
      await (await getCheckbox('object_lock')).check();
      expect(spectator.component.canSubmit()).toBe(false);

      await (await getCheckbox('object_lock')).uncheck();

      expect(spectator.component.form.controls.object_lock_default_days.errors).toBeNull();
      expect(spectator.component.canSubmit()).toBe(true);
    });

    it('does not let a hidden snapshot listing limit block Save, and sends the stored limit instead', async () => {
      await clickAdvancedOptions();
      // The CDK harness cannot type an empty string, so an out-of-range value stands in for a blank one.
      await (await getInput('snapshot_versions_max')).setValue('0');
      expect(spectator.component.canSubmit()).toBe(false);

      await (await getSelect('versioning')).selectOption('Off');

      expect(spectator.component.form.controls.snapshot_versions_max.errors).toBeNull();
      expect(spectator.component.canSubmit()).toBe(true);

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.update', [7, expect.objectContaining({
        versioning: S3Versioning.Off,
        snapshot_versions_max: 64,
      })]);
    });

    it('keeps the Basic toggle disabled while an advanced field is invalid', async () => {
      await clickAdvancedOptions();
      const [toggle] = spectator.component.footerActions;
      expect(toggle.disabled()).toBe(false);

      await (await getInput('snapshot_versions_max')).setValue('0');
      expect(toggle.disabled()).toBe(true);

      await (await getInput('snapshot_versions_max')).setValue('5');
      expect(toggle.disabled()).toBe(false);

      const grants = await loader.getHarness(TnFormListHarness.with({ label: 'Grants' }));
      await grants.add();
      expect(toggle.disabled()).toBe(true);
    });

    it('does not let a hidden out-of-range retention period block Save', async () => {
      await (await getCheckbox('object_lock')).check();
      await (await getSelect('object_lock_default_mode')).selectOption('Governance');
      await (await getInput('object_lock_default_days')).setValue('0');
      expect(spectator.component.canSubmit()).toBe(false);

      await (await getCheckbox('object_lock')).uncheck();

      expect(spectator.component.form.controls.object_lock_default_days.errors).toBeNull();
      expect(spectator.component.canSubmit()).toBe(true);
    });

    it('updates the bucket without sending the dataset', async () => {
      await setOwner('bob');
      await (await getCheckbox('enabled')).uncheck();

      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);
      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.update', [7, {
        name: 'photos',
        owner: 'bob',
        enabled: false,
        permissions_model: S3PermissionsModel.S3,
        grants: [{ principal_type: S3PrincipalType.Group, xid: 1001, access: S3Access.ReadWrite }],
        versioning: S3Versioning.Enabled,
        snapshot_versions: ['auto-*'],
        snapshot_versions_max: 64,
        multipart_etag: S3MultipartEtag.Composite,
        object_lock: false,
        object_lock_default_mode: null,
        object_lock_default_days: null,
      }]);
      expect(closed).toHaveBeenCalledWith(true);
    });
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnCheckboxHarness, TnDialog, TnFormFieldHarness, TnFormListHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  S3Access, S3MultipartEtag, S3PermissionsModel, S3PrincipalType, S3Versioning,
} from 'app/enums/s3.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { Group } from 'app/interfaces/group.interface';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { User } from 'app/interfaces/user.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
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

    it('shows only basic fields until Advanced Options is pressed', async () => {
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Permissions Model' }))).toBe(false);

      await clickAdvancedOptions();

      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Permissions Model' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Versioning' }))).toBe(true);
      expect(await loader.hasHarness(TnCheckboxHarness.with({ label: 'Enable Object Lock' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Multipart ETag' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Audit' }))).toBe(false);
    });

    it('rejects the /mnt root as a parent dataset', async () => {
      await (await getInput('name')).setValue('photos');
      await form.fillForm({
        'Parent Dataset': '/mnt',
        Owner: 'alice',
      });

      expect(spectator.component.canSubmit()).toBe(false);
      expect(spectator.component.form.controls.parent_dataset.errors).toMatchObject({
        customValidator: { message: 'Select a pool or dataset. The /mnt directory itself is not a dataset.' },
      });
    });

    it('rejects a bucket whose dataset already exists under the parent', async () => {
      await (await getInput('name')).setValue('photos');
      await form.fillForm({
        'Parent Dataset': 'tank/buckets',
        Owner: 'alice',
      });

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
        Owner: 'alice',
      });

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
        Owner: 'alice',
      });

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
      expect(await (await getSelect('principal_type')).getDisplayText()).toBe('Group');
      expect(await (await getSelect('access')).getDisplayText()).toBe('Read / Write');
    });

    it('updates the bucket without sending the dataset', async () => {
      await form.fillForm({ Owner: 'bob' });
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

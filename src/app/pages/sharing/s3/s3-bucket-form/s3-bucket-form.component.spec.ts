import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
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
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectServices } from 'app/store/services/services.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

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

  const slideInRef: SlideInRef<S3Bucket | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): S3Bucket | undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: S3BucketFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockApi([
        mockCall('user.query', [
          { username: 'alice', uid: 1000 },
          { username: 'bob', uid: 1001 },
        ] as User[]),
        mockCall('sharing.s3.create'),
        mockCall('sharing.s3.update'),
        mockCall('sharing.s3.audit_choices', { GetObject: 'GetObject', PutObject: 'PutObject' }),
        mockCall('pool.filesystem_choices', ['tank', 'tank/buckets', 'tank/buckets/photos']),
        mockCall('group.query', [{ group: 'staff', gid: 1001 }] as Group[]),
      ]),
      mockAuth(),
      mockProvider(SnackbarService),
      mockProvider(DatasetService, {
        getDatasetNodeProvider: () => () => of([]),
      }),
      mockProvider(SlideInRef, slideInRef),
      provideMockStore({
        selectors: [
          { selector: selectServices, value: [] },
          { selector: selectIsEnterprise, value: false },
        ],
      }),
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
      const labels = await form.getLabels();
      expect(labels).toEqual(['Name', 'Parent Dataset', 'Owner', 'Enabled']);

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const advancedLabels = await form.getLabels();
      expect(advancedLabels).toContain('Permissions Model');
      expect(advancedLabels).toContain('Versioning');
      expect(advancedLabels).toContain('Enable Object Lock');
      expect(advancedLabels).toContain('Multipart ETag');
      expect(advancedLabels).not.toContain('Audit');
    });

    it('rejects the /mnt root as a parent dataset', async () => {
      await form.fillForm({
        Name: 'photos',
        'Parent Dataset': '/mnt',
        Owner: 'alice',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
      expect(spectator.component.form.controls.parent_dataset.errors).toMatchObject({
        customValidator: { message: 'Select a pool or dataset. The /mnt directory itself is not a dataset.' },
      });
    });

    it('rejects a bucket whose dataset already exists under the parent', async () => {
      await form.fillForm({
        Name: 'photos',
        'Parent Dataset': 'tank/buckets',
        Owner: 'alice',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
      expect(spectator.component.form.controls.name.errors).toMatchObject({
        customValidator: { message: 'A dataset with this name already exists under the selected parent dataset.' },
      });

      await form.fillForm({ Name: 'videos' });
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('creates a bucket under the chosen parent dataset', async () => {
      await form.fillForm({
        Name: 'videos',
        'Parent Dataset': 'tank/buckets',
        Owner: 'alice',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

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
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true });
    });

    it('adds grants in advanced mode', async () => {
      await form.fillForm({
        Name: 'shared',
        'Parent Dataset': 'tank',
        Owner: 'alice',
      });

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const grants = await loader.getHarness(IxListHarness.with({ label: 'Grants' }));
      await grants.pressAddButton();
      await form.fillForm({
        Principal: 'Everyone',
        Access: 'Read Only',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.create', [expect.objectContaining({
        dataset: 'tank/shared',
        grants: [{ principal_type: S3PrincipalType.Everyone, xid: null, access: S3Access.ReadOnly }],
      })]);
    });
  });

  describe('editing a bucket', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => existingBucket }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('shows existing values with the dataset read only', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const values = await form.getValues();
      expect(values).toMatchObject({
        Name: 'photos',
        Dataset: 'tank/buckets/photos',
        Owner: 'alice',
        Enabled: true,
        'Permissions Model': 'S3 Only',
        Versioning: 'Enabled',
        'Snapshot Versions': ['auto-*'],
      });

      const grants = await loader.getHarness(IxListHarness.with({ label: 'Grants' }));
      expect(await grants.getFormValues()).toEqual([{
        Principal: 'Group',
        Group: 'staff',
        Access: 'Read / Write',
      }]);
    });

    it('updates the bucket without sending the dataset', async () => {
      await form.fillForm({
        Owner: 'bob',
        Enabled: false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

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
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true });
    });
  });
});

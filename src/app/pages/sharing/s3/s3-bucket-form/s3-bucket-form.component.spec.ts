import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockEntitlements } from 'app/core/testing/utils/mock-entitlements.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import {
  S3Access, S3MultipartEtag, S3ObjectLockMode, S3ObjectOwnership, S3PermissionsModel, S3PrincipalType, S3Versioning,
} from 'app/enums/s3.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { Group } from 'app/interfaces/group.interface';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
    object_ownership: S3ObjectOwnership.BucketOwnerPreferred,
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
        mockCall('sharing.s3.force_disable_versioning'),
        mockCall('sharing.s3.audit_choices', { GetObject: 'GetObject', PutObject: 'PutObject' }),
        mockCall('pool.filesystem_choices', ['tank', 'tank/buckets', 'tank/buckets/photos']),
        mockCall('group.query', [{ group: 'staff', gid: 1001 }] as Group[]),
      ]),
      mockAuth(),
      mockProvider(SnackbarService),
      mockProvider(DialogService, { confirm: jest.fn(() => of(true)) }),
      mockProvider(DatasetService, {
        getDatasetNodeProvider: () => () => of([]),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockEntitlements(),
      provideMockStore({
        selectors: [
          { selector: selectServices, value: [] },
          { selector: selectLicense, value: null },
        ],
      }),
    ],
  });

  const clickAdvancedOptions = async (): Promise<void> => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
    await advancedButton.click();
  };

  const getSaveButton = (): Promise<MatButtonHarness> => loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

  const getSelect = async (label: string): Promise<IxSelectHarness> => {
    return await form.getControl(label) as IxSelectHarness;
  };

  const getCheckbox = async (label: string): Promise<IxCheckboxHarness> => {
    return await form.getControl(label) as IxCheckboxHarness;
  };

  /** A fieldset's text by its legend: the ix-* harnesses here do not expose hints. */
  const sectionText = (title: string): string => {
    return spectator.queryAll('ix-fieldset')
      .find((element) => element.querySelector('legend')?.textContent?.includes(title))
      ?.textContent ?? '';
  };

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
      const labels = await form.getLabels();
      expect(labels).toEqual(['Name', 'Parent Dataset', 'Owner', 'Enabled', 'Enable Object Lock']);

      await clickAdvancedOptions();

      const advancedLabels = await form.getLabels();
      expect(advancedLabels).toContain('Permissions Model');
      expect(advancedLabels).toContain('Object Ownership');
      expect(advancedLabels).toContain('Versioning');
      expect(advancedLabels).toContain('Multipart ETag');
      // Shown whatever the entitlement now; what changes without one is the Premium tag and
      // whether the controls respond.
      expect(advancedLabels).toContain('Audit');
    });

    it('defaults a new bucket to the Minted multipart ETag', async () => {
      await clickAdvancedOptions();

      expect(await (await getSelect('Multipart ETag')).getValue()).toBe('Minted (opaque token)');
    });

    it('turns versioning on and defaults to Compliance retention when object lock is enabled', async () => {
      await clickAdvancedOptions();
      expect(await (await getSelect('Versioning')).getValue()).toBe('Off');

      await form.fillForm({ 'Enable Object Lock': true });

      const versioning = await getSelect('Versioning');
      expect(await versioning.getValue()).toBe('Enabled');
      expect(await versioning.isDisabled()).toBe(true);
      expect(await (await getSelect('Default Retention Mode')).getValue()).toBe('Compliance');

      await form.fillForm({ 'Enable Object Lock': false });
      const released = await getSelect('Versioning');
      expect(await released.isDisabled()).toBe(false);
      expect(await released.getValue()).toBe('Off');
    });

    it('warns that object lock is permanent while it is ticked but not yet saved', async () => {
      expect(sectionText('Object Lock')).not.toContain('permanent');

      await form.fillForm({ 'Enable Object Lock': true });
      expect(sectionText('Object Lock')).toContain('permanent once saved');

      await form.fillForm({ 'Enable Object Lock': false });
      expect(sectionText('Object Lock')).not.toContain('permanent');
    });

    it('creates a bucket with object lock, versioning and the Compliance default rule', async () => {
      await form.fillForm({
        Name: 'backups',
        'Parent Dataset': 'tank',
        Owner: 'alice',
        'Enable Object Lock': true,
      });
      await form.fillForm({ 'Default Retention Days': 30 });

      await (await getSaveButton()).click();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.create', [expect.objectContaining({
        versioning: S3Versioning.Enabled,
        object_lock: true,
        object_lock_default_mode: S3ObjectLockMode.Compliance,
        object_lock_default_days: 30,
      })]);
    });

    it('keeps a "no default rule" chosen in this session when object lock is re-checked', async () => {
      await form.fillForm({ 'Enable Object Lock': true });
      await form.fillForm({ 'Default Retention Mode': 'No default rule' });
      await form.fillForm({ 'Enable Object Lock': false });
      await form.fillForm({ 'Enable Object Lock': true });

      expect(spectator.component.form.controls.object_lock_default_mode.value).toBeNull();
    });

    it('does not leave versioning on after object lock is checked and unchecked in basic mode', async () => {
      await form.fillForm({
        Name: 'plain',
        'Parent Dataset': 'tank',
        Owner: 'alice',
      });
      await form.fillForm({ 'Enable Object Lock': true });
      await form.fillForm({ 'Enable Object Lock': false });

      await (await getSaveButton()).click();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.create', [expect.objectContaining({
        versioning: S3Versioning.Off,
        audit: null,
        audit_overflow: null,
        object_lock: false,
      })]);
    });

    it('does not offer object lock with the Multiprotocol permissions model', async () => {
      await clickAdvancedOptions();
      await form.fillForm({ 'Permissions Model': 'Multiprotocol' });

      const objectLock = await getCheckbox('Enable Object Lock');
      expect(await objectLock.isDisabled()).toBe(true);
      expect(await objectLock.getValue()).toBe(false);
    });

    it('holds object ownership at Object Writer while Multiprotocol is selected, then restores the choice', async () => {
      await clickAdvancedOptions();
      expect(await (await getSelect('Object Ownership')).getValue()).toBe('Bucket Owner Enforced');
      await form.fillForm({ 'Object Ownership': 'Bucket Owner Preferred' });

      await form.fillForm({ 'Permissions Model': 'Multiprotocol' });

      const folded = await getSelect('Object Ownership');
      expect(await folded.getValue()).toBe('Object Writer');
      expect(await folded.isDisabled()).toBe(true);

      await form.fillForm({ 'Permissions Model': 'S3' });

      const released = await getSelect('Object Ownership');
      expect(await released.isDisabled()).toBe(false);
      expect(await released.getValue()).toBe('Bucket Owner Preferred');
    });

    it('sends Object Writer ownership for a Multiprotocol bucket', async () => {
      await form.fillForm({
        Name: 'shared',
        'Parent Dataset': 'tank',
        Owner: 'alice',
      });
      await clickAdvancedOptions();
      await form.fillForm({ 'Permissions Model': 'Multiprotocol' });

      await (await getSaveButton()).click();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.create', [expect.objectContaining({
        permissions_model: S3PermissionsModel.Multiprotocol,
        object_ownership: S3ObjectOwnership.ObjectWriter,
      })]);
    });

    it('requires retention days once object lock is on with a default retention mode', async () => {
      await form.fillForm({
        Name: 'backups',
        'Parent Dataset': 'tank',
        Owner: 'alice',
        'Enable Object Lock': true,
      });

      expect(spectator.component.form.controls.object_lock_default_days.errors).toMatchObject({ required: true });
      expect(await (await getSaveButton()).isDisabled()).toBe(true);
    });

    it('stops requiring retention days once object lock is turned off again', async () => {
      await form.fillForm({
        Name: 'backups',
        'Parent Dataset': 'tank',
        Owner: 'alice',
        'Enable Object Lock': true,
      });
      expect(await (await getSaveButton()).isDisabled()).toBe(true);

      await form.fillForm({ 'Enable Object Lock': false });

      expect(spectator.component.form.controls.object_lock_default_days.disabled).toBe(true);
      expect(await (await getSaveButton()).isDisabled()).toBe(false);
    });

    it('does not let a hidden out-of-range retention period block Save', async () => {
      await form.fillForm({
        Name: 'backups',
        'Parent Dataset': 'tank',
        Owner: 'alice',
        'Enable Object Lock': true,
      });
      await form.fillForm({ 'Default Retention Mode': 'Governance' });
      await form.fillForm({ 'Default Retention Days': 0 });
      expect(await (await getSaveButton()).isDisabled()).toBe(true);

      await form.fillForm({ 'Default Retention Mode': 'No default rule' });

      expect(await (await getSaveButton()).isDisabled()).toBe(false);
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
        permissions_model: S3PermissionsModel.S3,
        object_ownership: S3ObjectOwnership.BucketOwnerEnforced,
        grants: [],
        versioning: S3Versioning.Off,
        audit: null,
        audit_overflow: null,
        snapshot_versions: [],
        snapshot_versions_max: 64,
        multipart_etag: S3MultipartEtag.Minted,
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

  describe('premium features', () => {
    /**
     * The point of the treatment: a denied feature is still on screen, so an administrator can
     * see what the product offers. What changes is the tag and whether the controls respond.
     * Located by the fieldset the wrapper tags, not by a data-test id.
     */
    function premiumBadge(title: string): HTMLElement | null {
      const wrapper = spectator.queryAll('ix-premium-feature-wrapper').find((element) => {
        return element.querySelector('legend')?.textContent?.includes(title);
      });
      return wrapper?.querySelector('ix-premium-badge') ?? null;
    }

    async function renderWith(denied: EntitlementFeature[]): Promise<void> {
      spectator = createComponent({ providers: [mockEntitlements(denied)] });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    }

    it('leaves versioning, object lock and auditing untagged when the system is entitled', async () => {
      await renderWith([]);
      await clickAdvancedOptions();

      expect(premiumBadge('Object Lock')).toBeNull();
      expect(premiumBadge('Versioning')).toBeNull();
      expect(premiumBadge('Auditing')).toBeNull();
    });

    it('tags auditing without the S3_AUDIT key, and still shows it', async () => {
      await renderWith([EntitlementFeature.S3Audit]);
      await clickAdvancedOptions();

      expect(premiumBadge('Auditing')).not.toBeNull();
      expect(await form.getLabels()).toContain('Audit');
      // Versioning is a separate key, and is not implicated by this one.
      expect(premiumBadge('Versioning')).toBeNull();
    });

    it('keeps ZFS snapshot versions untagged and working without the S3_VERSIONING key', async () => {
      // Serving snapshots as versions is a TrueNAS feature, decoupled from S3 protocol versioning
      // and its entitlement in NAS-143800: a never-versioned bucket may still do it.
      await renderWith([EntitlementFeature.S3Versioning]);
      await clickAdvancedOptions();

      expect(premiumBadge('Versioning')).not.toBeNull();
      expect(sectionText('ZFS Snapshots')).toContain('Snapshot Versions');
      expect(premiumBadge('ZFS Snapshots')).toBeNull();

      // Offered with versioning Off, and the listing limit arrives with the first pattern.
      expect(spectator.component.form.controls.versioning.value).toBe(S3Versioning.Off);
      expect(await form.getLabels()).not.toContain('Snapshot Versions Listed');
      await form.fillForm({ 'Snapshot Versions': ['auto-*'] });
      expect(await form.getLabels()).toContain('Snapshot Versions Listed');

      await form.fillForm({
        Name: 'videos',
        'Parent Dataset': 'tank/buckets',
        Owner: 'alice',
      });
      await (await getSaveButton()).click();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.create', [expect.objectContaining({
        versioning: S3Versioning.Off,
        snapshot_versions: ['auto-*'],
        snapshot_versions_max: 64,
      })]);
    });

    it('tags object lock as well as versioning without the S3_VERSIONING key', async () => {
      // Object lock is implemented with versioning, so the one key gates both.
      await renderWith([EntitlementFeature.S3Versioning]);

      expect(premiumBadge('Object Lock')).not.toBeNull();

      await clickAdvancedOptions();

      expect(premiumBadge('Versioning')).not.toBeNull();
      expect(premiumBadge('Auditing')).toBeNull();
    });

    it('sends no audit settings without the key, rather than the form\'s defaults', async () => {
      await renderWith([EntitlementFeature.S3Audit]);
      await form.fillForm({
        Name: 'videos',
        'Parent Dataset': 'tank/buckets',
        Owner: 'alice',
      });
      await (await getSaveButton()).click();

      // Read off the actual call rather than matched in place: a `not.objectContaining` nested
      // in the expected array passes whatever the payload holds.
      const createCall = jest.mocked(api.call).mock.calls
        .find(([method]) => method === 'sharing.s3.create');
      const payload = (createCall?.[1] as [Record<string, unknown>])[0];

      expect(payload).not.toHaveProperty('audit');
      expect(payload).not.toHaveProperty('audit_overflow');
      expect(payload).toMatchObject({ name: 'videos' });
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
        'Permissions Model': 'S3',
        'Object Ownership': 'Bucket Owner Preferred',
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

    it('refuses to take versioning back to Off on a bucket that already has it', async () => {
      await clickAdvancedOptions();
      const versioning = await getSelect('Versioning');

      // Middleware gates the transition, not the state: a bucket that arrived versioned may move
      // between Enabled and Suspended, never back to Off. Said here rather than left to the save.
      await versioning.setValue('Off');
      expect(spectator.component.form.controls.versioning.value).toBe(S3Versioning.Enabled);

      await versioning.setValue('Suspended');
      expect(spectator.component.form.controls.versioning.value).toBe(S3Versioning.Suspended);

      expect(sectionText('Versioning')).toContain('force it off below');
    });

    it('offers the destructive way out beside the option it unlocks, and applies it', async () => {
      await clickAdvancedOptions();

      await (await loader.getHarness(MatButtonHarness.with({ text: 'Force Disable Versioning' }))).click();

      // A confirmation checkbox rather than a plain yes: `sharing.s3.update` refuses this transition
      // precisely because the versions cannot survive it.
      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({ confirmationCheckboxText: expect.any(String), buttonColor: 'warn' }),
      );
      expect(api.call).toHaveBeenCalledWith('sharing.s3.force_disable_versioning', [7]);
      // Closed as a success, so the opener reloads. A stale row would reopen with versioning on, and
      // an unrelated Save from it would re-enable versioning on the bucket just forced off.
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true });
    });

    it('does not let a hidden snapshot listing limit block Save, and sends the stored limit instead', async () => {
      await clickAdvancedOptions();
      await form.fillForm({ 'Snapshot Versions Listed': 0 });
      expect(await (await getSaveButton()).isDisabled()).toBe(true);

      // The limit applies to a selection, so clearing the patterns hides it — and a hidden field
      // must not keep Save disabled with nothing on screen to fix.
      await form.fillForm({ 'Snapshot Versions': [] });

      expect(await form.getLabels()).not.toContain('Snapshot Versions Listed');
      expect(await (await getSaveButton()).isDisabled()).toBe(false);

      await (await getSaveButton()).click();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.update', [7, expect.objectContaining({
        versioning: S3Versioning.Enabled,
        snapshot_versions: [],
        snapshot_versions_max: 64,
      })]);
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
        object_ownership: S3ObjectOwnership.BucketOwnerPreferred,
        grants: [{ principal_type: S3PrincipalType.Group, xid: 1001, access: S3Access.ReadWrite }],
        versioning: S3Versioning.Enabled,
        snapshot_versions: ['auto-*'],
        snapshot_versions_max: 64,
        multipart_etag: S3MultipartEtag.Composite,
        object_lock: false,
        object_lock_default_mode: null,
        object_lock_default_days: null,
        audit: null,
        audit_overflow: null,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true });
    });
  });

  describe('editing a bucket stored with object lock and no default rule', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: () => ({ ...existingBucket, object_lock: true, object_lock_default_mode: null }),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('keeps the stored "no default rule" when object lock is unchecked and re-checked', async () => {
      await form.fillForm({ 'Enable Object Lock': false });
      await form.fillForm({ 'Enable Object Lock': true });

      expect(spectator.component.form.controls.object_lock_default_mode.value).toBeNull();
    });
  });

  describe('editing a bucket that already has object lock', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => ({ ...existingBucket, object_lock: true }) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('holds object lock, which middleware will not lower', async () => {
      const lock = await getCheckbox('Enable Object Lock');
      expect(await lock.getValue()).toBe(true);
      expect(await lock.isDisabled()).toBe(true);
      expect(sectionText('Object Lock')).toContain('cannot be turned off');
    });

    it('shows Force Disable Versioning disabled, with the reason where a hover reaches it', async () => {
      await clickAdvancedOptions();

      const force = await loader.getHarness(MatButtonHarness.with({ text: 'Force Disable Versioning' }));
      expect(await force.isDisabled()).toBe(true);

      const reason = spectator.query('.force-disable-versioning', { read: MatTooltip });
      expect(reason?.message).toContain('keeps its version history');
      expect(reason?.disabled).toBe(false);

      // And the select says the state is permanent, not "while object lock is on".
      expect(sectionText('Versioning')).toContain('for as long as this bucket exists');
    });
  });

  describe('editing a stored Multiprotocol bucket', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: () => ({
              ...existingBucket,
              permissions_model: S3PermissionsModel.Multiprotocol,
              object_ownership: S3ObjectOwnership.ObjectWriter,
            }),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('holds its ownership at Object Writer and keeps object lock unavailable', async () => {
      await clickAdvancedOptions();

      const ownership = await getSelect('Object Ownership');
      expect(await ownership.getValue()).toBe('Object Writer');
      expect(await ownership.isDisabled()).toBe(true);
      expect(await (await getCheckbox('Enable Object Lock')).isDisabled()).toBe(true);
    });
  });
});

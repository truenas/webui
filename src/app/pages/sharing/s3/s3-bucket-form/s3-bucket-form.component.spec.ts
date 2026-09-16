import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnAutocompleteHarness, TnButtonHarness, TnCheckboxHarness, TnChipInputHarness, TnDialog, TnFormFieldHarness,
  TnFormListHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
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
import {
  IxUserComboboxComponent,
} from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-user-combobox.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { IxUserComboboxHarness } from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { ApiService } from 'app/modules/websocket/api.service';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { s3UserFormPreset } from 'app/pages/sharing/s3/utils/s3-user-picker.utils';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { EntitlementsService } from 'app/services/entitlements.service';
import { AppState } from 'app/store';
import { entitlementsLoadFailed } from 'app/store/entitlements/entitlements.actions';
import { entitlementsReducer } from 'app/store/entitlements/entitlements.reducer';
import { entitlementsStateKey } from 'app/store/entitlements/entitlements.selectors';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectServices } from 'app/store/services/services.selectors';

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
        mockCall('sharing.s3.force_disable_versioning'),
        mockCall('sharing.s3.audit_choices', { GetObject: 'GetObject', PutObject: 'PutObject' }),
        mockCall('pool.filesystem_choices', ['tank', 'tank/buckets', 'tank/buckets/photos']),
        mockCall('user.query', [
          { username: 'alice', uid: 1000 },
          { username: 'bob', uid: 1001 },
        ] as User[]),
        mockCall('group.query', [{ group: 'staff', gid: 1001 }] as Group[]),
      ]),
      mockAuth(),
      mockProvider(DialogService, { confirm: jest.fn(() => of(true)) }),
      mockEntitlements(),
      mockProvider(DatasetService, {
        getDatasetNodeProvider: () => () => of([]),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({ closed: of(true) })),
      }),
      provideMockStore({
        selectors: [
          { selector: selectServices, value: [] },
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

    it('opens "Add New" on a user-form preset for an S3 account', () => {
      // An account created from here owns a bucket or signs a key; it is not an
      // SMB account and never signs in. See `s3UserFormPreset`.
      expect(spectator.query(IxUserComboboxComponent).createPreset()).toEqual(s3UserFormPreset);
    });

    it('shows object lock with the basic fields and the rest only after Advanced Options is pressed', async () => {
      expect(await loader.hasHarness(TnCheckboxHarness.with({ label: 'Enable Object Lock' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Permissions Model' }))).toBe(false);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Versioning' }))).toBe(false);

      await clickAdvancedOptions();

      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Permissions Model' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Object Ownership' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Versioning' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Multipart ETag' }))).toBe(true);
      // Shown whatever the entitlement; what changes without one is the Premium tag and
      // whether the controls respond. See the premium-features describe below.
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Audit' }))).toBe(true);
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

    it('holds object ownership at Object Writer while Multiprotocol is selected, then restores the choice', async () => {
      await clickAdvancedOptions();
      const ownership = await getSelect('object_ownership');
      expect(await ownership.getDisplayText()).toBe('Bucket Owner Enforced');
      await ownership.selectOption('Bucket Owner Preferred');

      await (await getSelect('permissions_model')).selectOption('Multiprotocol');

      expect(await (await getSelect('object_ownership')).getDisplayText()).toBe('Object Writer');
      expect(await (await getSelect('object_ownership')).isDisabled()).toBe(true);

      await (await getSelect('permissions_model')).selectOption('S3');

      const released = await getSelect('object_ownership');
      expect(await released.isDisabled()).toBe(false);
      expect(await released.getDisplayText()).toBe('Bucket Owner Preferred');
    });

    it('sends Object Writer ownership for a Multiprotocol bucket', async () => {
      await (await getInput('name')).setValue('shared');
      await form.fillForm({
        'Parent Dataset': 'tank',
      });
      await setOwner('alice');
      await clickAdvancedOptions();
      await (await getSelect('permissions_model')).selectOption('Multiprotocol');

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.create', [expect.objectContaining({
        permissions_model: S3PermissionsModel.Multiprotocol,
        object_ownership: S3ObjectOwnership.ObjectWriter,
      })]);
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
        permissions_model: S3PermissionsModel.S3,
        object_ownership: S3ObjectOwnership.BucketOwnerEnforced,
        grants: [],
        versioning: S3Versioning.Off,
        snapshot_versions: [],
        snapshot_versions_max: 64,
        multipart_etag: S3MultipartEtag.Composite,
        audit: null,
        audit_overflow: null,
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

  describe('premium features', () => {
    /**
     * The point of the treatment: a denied feature is still on screen, so an
     * administrator can see what the product offers. What changes is the tag
     * and whether the controls respond.
     */
    function premiumBadge(heading: string): HTMLElement | null {
      // By the section's own <legend> — the accessible name tn-form-section gives the group —
      // rather than by a data-test id, so the assertion is about what is on screen.
      const wrapper = spectator.queryAll('ix-premium-feature-wrapper').find((element) => {
        return element.querySelector('legend')?.textContent?.includes(heading);
      });
      return wrapper?.querySelector('ix-premium-badge') ?? null;
    }

    it('leaves versioning, object lock and auditing untagged when the system is entitled', async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await clickAdvancedOptions();

      expect(premiumBadge('Versioning')).toBeNull();
      expect(premiumBadge('Object Lock')).toBeNull();
      expect(premiumBadge('Auditing')).toBeNull();
    });

    it('tags them when the loaded map carries no S3 key at all', async () => {
      // The reported case: middleware older than the S3 entries in its own POLICY answers
      // `truenas.entitlements.info` without them. Run through the real service and selector
      // rather than a mocked decision, because the absent key *is* what is under test.
      spectator = createComponent({
        providers: [{ provide: EntitlementsService, useClass: EntitlementsService }],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      // Nothing is tagged before the answer arrives, which is the other half of the contract.
      expect(premiumBadge('Object Lock')).toBeNull();

      const mockStore$ = spectator.inject(MockStore);
      mockStore$.setState({ [entitlementsStateKey]: { entitlements: {} } });
      mockStore$.refreshState();
      spectator.detectChanges();

      expect(premiumBadge('Object Lock')).not.toBeNull();

      await clickAdvancedOptions();

      expect(premiumBadge('Versioning')).not.toBeNull();
      expect(premiumBadge('Auditing')).not.toBeNull();
    });

    it('tags nothing when the entitlement call failed, on a system that may well hold the key', () => {
      // `entitlementsLoadFailed` resolves to a map carrying SUPPORT alone — the same shape as an
      // older middleware, for the opposite reason. Denying on it would put a Premium tag on a
      // licensed appliance and drop its audit settings from the create below.
      spectator = createComponent({
        providers: [{ provide: EntitlementsService, useClass: EntitlementsService }],
      });
      const mockStore$ = spectator.inject(MockStore);

      mockStore$.setState({
        [entitlementsStateKey]: {
          entitlements: entitlementsReducer(undefined, entitlementsLoadFailed()).entitlements,
          assumed: true,
        },
      });
      mockStore$.refreshState();
      spectator.detectChanges();

      expect(premiumBadge('Object Lock')).toBeNull();
    });

    it('tags auditing without the S3_AUDIT key, and still shows it', async () => {
      spectator = createComponent({
        providers: [mockEntitlements([EntitlementFeature.S3Audit])],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await clickAdvancedOptions();

      expect(premiumBadge('Auditing')).not.toBeNull();
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Audit' }))).toBe(true);
      // Versioning is a separate key, and is not implicated by this one.
      expect(premiumBadge('Versioning')).toBeNull();
    });

    it('tags object lock as well as versioning without the S3_VERSIONING key', async () => {
      // Object lock is implemented with versioning, so the one key gates both.
      spectator = createComponent({
        providers: [mockEntitlements([EntitlementFeature.S3Versioning])],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      expect(premiumBadge('Object Lock')).not.toBeNull();

      await clickAdvancedOptions();

      expect(premiumBadge('Versioning')).not.toBeNull();
      expect(premiumBadge('Auditing')).toBeNull();
    });

    it('sends no audit settings without the key, rather than the form\'s defaults', async () => {
      spectator = createComponent({
        providers: [mockEntitlements([EntitlementFeature.S3Audit])],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);

      await form.fillForm({
        Name: 'videos',
        'Parent Dataset': 'tank/buckets',
        Owner: 'alice',
      });
      spectator.component.submit();

      // Read off the actual call rather than matched in place: a
      // `not.objectContaining` nested in the expected array passes whatever the
      // payload holds, so the assertion would never have failed.
      const createCall = jest.mocked(api.call).mock.calls
        .find(([method]) => method === 'sharing.s3.create');
      const payload = (createCall?.[1] as [Record<string, unknown>])[0];

      expect(payload).not.toHaveProperty('audit');
      expect(payload).not.toHaveProperty('audit_overflow');
      expect(payload).toMatchObject({ name: 'videos' });
    });

    it('sends the audit settings on screen while the entitlement map is still loading', async () => {
      // `undefined` is "not answered yet", and every gated section renders plainly meanwhile.
      // Reading that as a denial would quietly drop fields the form is showing as live.
      spectator = createComponent({
        providers: [
          mockProvider(EntitlementsService, {
            entitled: () => () => undefined,
            entitledStrictly: () => () => undefined,
            entitled$: () => of(true),
            entitlement: () => () => undefined,
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);

      await form.fillForm({
        Name: 'videos',
        'Parent Dataset': 'tank/buckets',
        Owner: 'alice',
      });
      spectator.component.submit();

      const createCall = jest.mocked(api.call).mock.calls
        .find(([method]) => method === 'sharing.s3.create');
      const payload = (createCall?.[1] as [Record<string, unknown>])[0];

      expect(payload).toHaveProperty('audit');
      expect(payload).toHaveProperty('audit_overflow');
    });

    it('keeps the object lock a bucket already has when the versioning key is missing', () => {
      // Middleware latches object lock on the dataset root and gates the transition rather than
      // the state, so a bucket that has it keeps it on an unentitled appliance. Clearing the
      // control here would turn a save of something else on the form into an attempt to unlock.
      const lockedBucket = {
        ...existingBucket,
        object_lock: true,
        object_lock_default_mode: S3ObjectLockMode.Compliance,
        object_lock_default_days: 30,
      } as S3Bucket;
      spectator = createComponent({
        props: { bucket: lockedBucket },
        providers: [mockEntitlements([EntitlementFeature.S3Versioning])],
      });
      api = spectator.inject(ApiService);

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('sharing.s3.update', [7, expect.objectContaining({
        object_lock: true,
        object_lock_default_mode: S3ObjectLockMode.Compliance,
        object_lock_default_days: 30,
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
      expect(await (await getSelect('permissions_model')).getDisplayText()).toBe('S3');
      expect(await (await getSelect('object_ownership')).getDisplayText()).toBe('Bucket Owner Preferred');
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

    it('loads a stored Multiprotocol bucket with its ownership held at Object Writer', async () => {
      spectator = createComponent({
        props: {
          bucket: {
            ...existingBucket,
            permissions_model: S3PermissionsModel.Multiprotocol,
            object_ownership: S3ObjectOwnership.ObjectWriter,
          },
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await clickAdvancedOptions();

      const ownership = await getSelect('object_ownership');
      expect(await ownership.getDisplayText()).toBe('Object Writer');
      expect(await ownership.isDisabled()).toBe(true);
      expect(await (await getCheckbox('object_lock')).isDisabled()).toBe(true);
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

    it('commits a principal picked after the row switches type', async () => {
      await clickAdvancedOptions();

      // The row loads as the group `staff` (gid 1001) and `bob` carries the same number as a uid,
      // so the picker has to name the principal it actually fetched, not the one the row was
      // loaded with.
      await (await getSelect('principal_type')).selectOption('User');

      // The owner picker is an autocomplete too, so scope to the grant row.
      const principal = await loader.getHarness(TnAutocompleteHarness.with({ ancestor: 'tn-form-list-item' }));
      await principal.selectOption('bob');
      await principal.blur();

      expect(await principal.getInputValue()).toBe('bob');
      expect(spectator.component.form.controls.grants.at(0).controls.xid.value).toBe(1001);
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

    it('refuses to take versioning back to Off on a bucket that already has it', async () => {
      await clickAdvancedOptions();
      const versioning = await getSelect('versioning');

      // Middleware gates the transition, not the state: a bucket that arrived versioned may move
      // between Enabled and Suspended, never back to Off. Said here rather than left to the save.
      await versioning.selectOption('Off');
      expect(await versioning.getDisplayText()).toBe('Enabled');
      expect(spectator.component.form.controls.versioning.value).toBe(S3Versioning.Enabled);

      // Suspended is still reachable — it keeps the stored versions.
      await versioning.selectOption('Suspended');
      expect(spectator.component.form.controls.versioning.value).toBe(S3Versioning.Suspended);

      // And the hint says where the deliberate way through lives.
      const field = await loader.getHarness(TnFormFieldHarness.with({ label: 'Versioning' }));
      expect(await field.getHint()).toContain('Force Disable Versioning');
    });

    it('offers the destructive way out beside the option it unlocks, and applies it', async () => {
      await clickAdvancedOptions();

      const force = await loader.getHarness(TnButtonHarness.with({ label: 'Force Disable Versioning' }));
      await force.click();

      // A confirmation checkbox rather than a plain yes: `sharing.s3.update` refuses this
      // transition precisely because the versions cannot survive it.
      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({ confirmationCheckboxText: expect.any(String), buttonColor: 'warn' }),
      );
      expect(api.call).toHaveBeenCalledWith('sharing.s3.force_disable_versioning', [7]);

      // The open form follows the saved bucket, so a later Save cannot write the old values back.
      expect(spectator.component.form.controls.versioning.value).toBe(S3Versioning.Off);
      expect(spectator.component.form.controls.snapshot_versions.value).toEqual([]);
    });

    it('does not offer it on a locked bucket, which keeps its history', async () => {
      spectator = createComponent({
        props: { bucket: { ...existingBucket, object_lock: true } as S3Bucket },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await clickAdvancedOptions();

      // Middleware refuses those outright, so the hint carries the reason instead of a button.
      expect(await loader.hasHarness(TnButtonHarness.with({ label: 'Force Disable Versioning' }))).toBe(false);
      const field = await loader.getHarness(TnFormFieldHarness.with({ label: 'Versioning' }));
      expect(await field.getHint()).toContain('object lock');
    });

    it('does not let a hidden snapshot listing limit block Save, and sends the stored limit instead', async () => {
      // A bucket stored unversioned, because the one it is turned back off from has to be one the
      // form still offers Off for: middleware gates the transition on the *stored* value, so a
      // bucket that arrived versioned can never return to Off here.
      spectator = createComponent({
        props: { bucket: { ...existingBucket, versioning: S3Versioning.Off } as S3Bucket },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);

      await clickAdvancedOptions();
      await (await getSelect('versioning')).selectOption('Enabled');
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
        object_ownership: S3ObjectOwnership.BucketOwnerPreferred,
        grants: [{ principal_type: S3PrincipalType.Group, xid: 1001, access: S3Access.ReadWrite }],
        versioning: S3Versioning.Enabled,
        snapshot_versions: ['auto-*'],
        snapshot_versions_max: 64,
        multipart_etag: S3MultipartEtag.Composite,
        audit: null,
        audit_overflow: null,
        object_lock: false,
        object_lock_default_mode: null,
        object_lock_default_days: null,
      }]);
      expect(closed).toHaveBeenCalledWith(true);
    });
  });
});

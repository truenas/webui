import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnRadioHarness, TnSelectHarness } from '@truenas/ui-components';
import { of, ReplaySubject } from 'rxjs';
import { AclType } from 'app/enums/acl-type.enum';
import {
  NfsAclTag, NfsAclType, NfsAdvancedFlag, NfsAdvancedPermission, NfsBasicFlag, NfsBasicPermission,
} from 'app/enums/nfs-acl.enum';
import { NfsAcl, NfsAclItem } from 'app/interfaces/acl.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { defaultDebounceTimeMs } from 'app/modules/forms/ix-forms/ix-forms.constants';
import {
  IxGroupComboboxHarness,
  IxUserComboboxHarness,
} from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ErrorParserService } from 'app/services/errors/error-parser.service';
import { StorageService } from 'app/services/storage.service';
import { UserDirectoryService } from 'app/services/user-directory.service';
import { UserService } from 'app/services/user.service';
import { EditNfsAceComponent, nfsAclTagOptionTestId } from './edit-nfs-ace.component';

describe('EditNfsAceComponent', () => {
  let spectator: Spectator<EditNfsAceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: EditNfsAceComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(DatasetAclEditorStore, {
        updateSelectedAce: jest.fn(),
        updateSelectedAceValidation: jest.fn(),
        settleAceValidation: jest.fn(),
      }),
      mockProvider(UserService, {
        userQueryDsCache: () => of([
          { username: 'root' },
          { username: 'trunk' },
          { username: 'leaves' },
        ] as User[]),
        groupQueryDsCache: () => of([
          { group: 'wheel' },
          { group: 'vip' },
        ]),
        getUserByNameCached: (username: string) => of({ username } as User),
        getGroupByNameCached: (groupName: string) => of({ group: groupName }),
      }),
    ],
  });

  // The user/group fields are their own CVAs, addressed by control name — the
  // control name sits on the wrapper, not on the tn-autocomplete inside it.
  const getUserField = (): Promise<IxUserComboboxHarness> => loader.getHarness(
    IxUserComboboxHarness.with({ selector: '[formControlName="user"]' }),
  );
  const getGroupField = (): Promise<IxGroupComboboxHarness> => loader.getHarness(
    IxGroupComboboxHarness.with({ selector: '[formControlName="group"]' }),
  );

  beforeEach(() => {
    spectator = createComponent({
      props: {
        ace: {
          tag: NfsAclTag.User,
          who: 'trunk',
          type: NfsAclType.Allow,
          perms: {
            [NfsAdvancedPermission.AppendData]: true,
            [NfsAdvancedPermission.Execute]: true,
            [NfsAdvancedPermission.ReadAcl]: true,
            [NfsAdvancedPermission.ReadData]: true,
          },
          flags: {
            [NfsAdvancedFlag.FileInherit]: true,
            [NfsAdvancedFlag.DirectoryInherit]: true,
          },
        } as NfsAclItem,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current ace values from ace input', async () => {
    const whoSelect = await loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="tag"]' }));
    expect(await whoSelect.getDisplayText()).toBe('User');

    const userCombobox = await getUserField();
    expect(await userCombobox.getInputValue()).toBe('trunk');

    const allowRadio = await loader.getHarness(TnRadioHarness.with({ label: 'Allow' }));
    expect(await allowRadio.isChecked()).toBe(true);

    const advancedPermsRadio = await loader.getHarness(
      TnRadioHarness.with({ testId: 'radio-button-permission-type-advanced' }),
    );
    expect(await advancedPermsRadio.isChecked()).toBe(true);

    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Read Data' }))).isChecked()).toBe(true);
    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Append Data' }))).isChecked()).toBe(true);
    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Execute' }))).isChecked()).toBe(true);
    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Read ACL' }))).isChecked()).toBe(true);
    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Write Data' }))).isChecked()).toBe(false);

    const advancedFlagsRadio = await loader.getHarness(
      TnRadioHarness.with({ testId: 'radio-button-flags-type-advanced' }),
    );
    expect(await advancedFlagsRadio.isChecked()).toBe(true);

    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'File Inherit' }))).isChecked()).toBe(true);
    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Directory Inherit' }))).isChecked()).toBe(true);
    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Inherit Only' }))).isChecked()).toBe(false);
  });

  it('updates value in store when form is updated', async () => {
    await (await loader.getHarness(TnRadioHarness.with({ label: 'Deny' }))).check();
    await (await loader.getHarness(TnRadioHarness.with({ testId: 'radio-button-permission-type-basic' }))).check();
    await (await loader.getHarness(TnRadioHarness.with({ testId: 'radio-button-flags-type-basic' }))).check();

    const basicPermissionSelect = await loader.getHarness(
      TnSelectHarness.with({ selector: '[formControlName="basicPermission"]' }),
    );
    await basicPermissionSelect.selectOption('Full Control');

    await (await loader.getHarness(TnRadioHarness.with({ label: 'Inherit' }))).check();

    expect(spectator.inject(DatasetAclEditorStore).updateSelectedAce).toHaveBeenLastCalledWith({
      tag: NfsAclTag.User,
      who: 'trunk',
      type: NfsAclType.Deny,
      flags: { BASIC: NfsBasicFlag.Inherit },
      perms: { BASIC: NfsBasicPermission.FullControl },
    });
    expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenCalled();
  });

  describe('user ace', () => {
    it('shows user combobox when Who is user', async () => {
      const userSelect = await getUserField();
      expect(userSelect).toExist();
    });

    it('allows custom values in User combobox', async () => {
      const userCombobox = await getUserField();
      await userCombobox.setInputValue('AD\\administrator');
      await userCombobox.blur();

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAce).toHaveBeenLastCalledWith(
        expect.objectContaining({ who: 'AD\\administrator' }),
      );
      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });
  });

  describe('Who option test ids', () => {
    it('keeps the Group and group@ options apart', () => {
      expect(nfsAclTagOptionTestId({ label: 'Group', value: NfsAclTag.UserGroup })).toBe('Group');
      expect(nfsAclTagOptionTestId({ label: 'group@', value: NfsAclTag.Group })).toBe('group-at');
    });

    it('leaves every other option on its label', () => {
      expect(nfsAclTagOptionTestId({ label: 'User', value: NfsAclTag.User })).toBe('User');
      expect(nfsAclTagOptionTestId({ label: 'owner@', value: NfsAclTag.Owner })).toBe('owner@');
      expect(nfsAclTagOptionTestId({ label: 'everyone@', value: NfsAclTag.Everyone })).toBe('everyone@');
    });

    it('falls back to the value for a label that normalizes to nothing, as the library does', () => {
      expect(nfsAclTagOptionTestId({ label: 'Группа', value: NfsAclTag.UserGroup })).toBe('GROUP');
      expect(nfsAclTagOptionTestId({ label: 'Группа@', value: NfsAclTag.Group })).toBe('group-at');
    });
  });

  describe('group ace', () => {
    it('shows group combobox when Who is group', async () => {
      const whoSelect = await loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="tag"]' }));
      await whoSelect.selectOption(/^Group$/);

      const groupSelect = await getGroupField();
      expect(groupSelect).toExist();
    });

    it('allows custom values in Group combobox', async () => {
      const whoSelect = await loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="tag"]' }));
      await whoSelect.selectOption(/^Group$/);

      const userCombobox = await getGroupField();
      await userCombobox.setInputValue('AD\\domain users');
      await userCombobox.blur();

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAce).toHaveBeenLastCalledWith(
        expect.objectContaining({ who: 'AD\\domain users' }),
      );
      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });
  });

  it('shows basic permissions select when permission type is basic', async () => {
    await (await loader.getHarness(TnRadioHarness.with({ testId: 'radio-button-permission-type-basic' }))).check();

    const basicPermSelect = await loader.getHarnessOrNull(
      TnSelectHarness.with({ selector: '[formControlName="basicPermission"]' }),
    );
    expect(basicPermSelect).not.toBeNull();
    const advancedPermCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Read Data' }));
    expect(advancedPermCheckbox).toBeNull();
  });

  it('shows advanced permissions checkbox list when permission type is advanced', async () => {
    await (await loader.getHarness(TnRadioHarness.with({ testId: 'radio-button-permission-type-advanced' }))).check();

    const readDataCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Read Data' }));
    const writeOwnerCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Write Owner' }));
    expect(readDataCheckbox).not.toBeNull();
    expect(writeOwnerCheckbox).not.toBeNull();
  });

  it('shows basic flags when flag type is basic', async () => {
    await (await loader.getHarness(TnRadioHarness.with({ testId: 'radio-button-flags-type-basic' }))).check();

    const basicFlagRadio = await loader.getHarness(TnRadioHarness.with({ label: 'Inherit' }));
    expect(basicFlagRadio).toExist();
    const advancedFlagCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'File Inherit' }));
    expect(advancedFlagCheckbox).toBeNull();
  });

  it('shows advanced flags when flag type is advanced', async () => {
    await (await loader.getHarness(TnRadioHarness.with({ testId: 'radio-button-flags-type-advanced' }))).check();

    const fileInheritCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'File Inherit' }));
    const inheritOnlyCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Inherit Only' }));
    expect(fileInheritCheckbox).not.toBeNull();
    expect(inheritOnlyCheckbox).not.toBeNull();
  });

  describe('validation', () => {
    it('reports invalid when ace input changes to User tag with no user selected', () => {
      spectator.setInput('ace', {
        tag: NfsAclTag.User,
        who: undefined,
        type: NfsAclType.Allow,
        perms: { BASIC: NfsBasicPermission.FullControl },
        flags: { BASIC: NfsBasicFlag.Inherit },
      } as NfsAclItem);

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(false);
    });

    it('reports invalid when ace input changes to Group tag with no group selected', () => {
      spectator.setInput('ace', {
        tag: NfsAclTag.UserGroup,
        who: undefined,
        type: NfsAclType.Allow,
        perms: { BASIC: NfsBasicPermission.FullControl },
        flags: { BASIC: NfsBasicFlag.Inherit },
      } as NfsAclItem);

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(false);
    });

    it('reports valid when ace input changes to owner@ tag (no user/group required)', () => {
      spectator.setInput('ace', {
        tag: NfsAclTag.Owner,
        type: NfsAclType.Allow,
        perms: { BASIC: NfsBasicPermission.FullControl },
        flags: { BASIC: NfsBasicFlag.Inherit },
      } as NfsAclItem);

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });

    it('reports valid when ace input changes to User tag with a user selected', () => {
      spectator.setInput('ace', {
        tag: NfsAclTag.User,
        who: 'root',
        type: NfsAclType.Allow,
        perms: { BASIC: NfsBasicPermission.FullControl },
        flags: { BASIC: NfsBasicFlag.Inherit },
      } as NfsAclItem);

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });

    it('reports valid when ace input changes to Group tag with a group selected', () => {
      spectator.setInput('ace', {
        tag: NfsAclTag.UserGroup,
        who: 'wheel',
        type: NfsAclType.Allow,
        perms: { BASIC: NfsBasicPermission.FullControl },
        flags: { BASIC: NfsBasicFlag.Inherit },
      } as NfsAclItem);

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });
  });
});

describe('EditNfsAceComponent leaving an entry while its user is still being checked', () => {
  let spectator: Spectator<EditNfsAceComponent>;
  let loader: HarnessLoader;
  let store: DatasetAclEditorStore;
  let userExists$: ReplaySubject<boolean>;

  const userWithoutName = {
    tag: NfsAclTag.User,
    type: NfsAclType.Allow,
    perms: { BASIC: NfsBasicPermission.Modify },
    flags: { BASIC: NfsBasicFlag.Inherit },
  } as NfsAclItem;
  const everyone = {
    tag: NfsAclTag.Everyone,
    type: NfsAclType.Allow,
    perms: { BASIC: NfsBasicPermission.Read },
    flags: { BASIC: NfsBasicFlag.Inherit },
  } as NfsAclItem;

  const createComponent = createComponentFactory({
    component: EditNfsAceComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      DatasetAclEditorStore,
      mockProvider(ApiService),
      mockProvider(ErrorHandlerService),
      mockProvider(ErrorParserService),
      mockProvider(DialogService),
      mockProvider(StorageService),
      mockProvider(UserDirectoryService, {
        pageSize: 50,
        queryUsers: () => of([]),
        queryGroups: () => of([]),
        // Answers only once a spec says so, so the check is still pending when the entry is left.
        userExists: () => userExists$,
      }),
    ],
    detectChanges: false,
  });

  /** Hands the form the store's selected entry, as the editor's template does on every render. */
  function renderSelectedAce(): void {
    const { acl, selectedAceIndex } = store.state();
    spectator.setInput('ace', acl.acl[selectedAceIndex] as NfsAclItem);
  }

  beforeEach(async () => {
    userExists$ = new ReplaySubject<boolean>(1);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store = spectator.inject(DatasetAclEditorStore);
    store.setState((state) => ({
      ...state,
      acl: { acltype: AclType.Nfs4, acl: [userWithoutName, everyone] } as NfsAcl,
      selectedAceIndex: 0,
    }));
    renderSelectedAce();

    const userField = await loader.getHarness(
      IxUserComboboxHarness.with({ selector: '[formControlName="user"]' }),
    );
    await userField.setInputValue('trunk');
    await userField.blur();
    // The edited entry comes back from the store as a new object, and the check starts again on it.
    renderSelectedAce();
  });

  it('clears the error on the earlier entry once its check passes after Add Item', async () => {
    expect(store.state().acesWithError).toEqual([0]);
    expect(spectator.component.form.pending).toBe(true);

    store.addAce();
    renderSelectedAce();
    userExists$.next(true);
    // The existence check waits out a debounce before it asks the directory.
    await new Promise((resolve) => {
      setTimeout(resolve, defaultDebounceTimeMs + 100);
    });

    // The new entry is a User entry with no user yet, so only it is still marked.
    expect(store.state().acesWithError).toEqual([2]);
  });

  it('clears the error on the earlier entry once its check passes after picking another in the list', async () => {
    // What `AclEditorListComponent.onAceSelected` does: no entry is selected for a moment, which removes this form,
    // and the picked one is selected in a later task, into a new form.
    store.selectAce(null);
    spectator.fixture.destroy();
    store.selectAce(1);
    userExists$.next(true);
    await new Promise((resolve) => {
      setTimeout(resolve, defaultDebounceTimeMs + 100);
    });

    expect(store.state().acesWithError).toEqual([]);
  });
});

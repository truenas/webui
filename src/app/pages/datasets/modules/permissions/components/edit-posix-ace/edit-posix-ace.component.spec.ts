import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnSelectHarness } from '@truenas/ui-components';
import { of, ReplaySubject } from 'rxjs';
import { AclType } from 'app/enums/acl-type.enum';
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';
import { PosixAcl, PosixAclItem } from 'app/interfaces/acl.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxPermissionsComponent } from 'app/modules/forms/controls/ix-permissions/ix-permissions.component';
import { defaultDebounceTimeMs } from 'app/modules/forms/ix-forms/ix-forms.constants';
import {
  IxGroupComboboxHarness,
  IxUserComboboxHarness,
} from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ErrorParserService } from 'app/services/errors/error-parser.service';
import { StorageService } from 'app/services/storage.service';
import { UserDirectoryService } from 'app/services/user-directory.service';
import { UserService } from 'app/services/user.service';
import { EditPosixAceComponent } from './edit-posix-ace.component';

describe('EditPosixAceComponent', () => {
  let spectator: Spectator<EditPosixAceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: EditPosixAceComponent,
    imports: [
      ReactiveFormsModule,
      IxPermissionsComponent,
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
        getUserByName: (username: string) => of({ username } as User),
        getGroupByName: (groupName: string) => of({ group: groupName }),
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
          tag: PosixAclTag.Group,
          who: 'wheel',
          perms: {
            [PosixPermission.Execute]: true,
            [PosixPermission.Write]: false,
            [PosixPermission.Read]: true,
          },
          default: true,
        } as PosixAclItem,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current ace values from ace input', async () => {
    const whoSelect = await loader.getHarness(TnSelectHarness);
    expect(await whoSelect.getDisplayText()).toBe('Group');

    const groupCombobox = await getGroupField();
    expect(await groupCombobox.getInputValue()).toBe('wheel');

    const readCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Read' }));
    const writeCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Write' }));
    const executeCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Execute' }));
    expect(await readCheckbox.isChecked()).toBe(true);
    expect(await writeCheckbox.isChecked()).toBe(false);
    expect(await executeCheckbox.isChecked()).toBe(true);

    const defaultCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Default' }));
    expect(await defaultCheckbox.isChecked()).toBe(true);
  });

  it('updates value in store when form is updated', async () => {
    const whoSelect = await loader.getHarness(TnSelectHarness);
    await whoSelect.selectOption(/^Mask$/);

    const executeCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Execute' }));
    await executeCheckbox.uncheck();

    expect(spectator.inject(DatasetAclEditorStore).updateSelectedAce).toHaveBeenLastCalledWith({
      tag: PosixAclTag.Mask,
      default: true,
      perms: {
        [PosixPermission.Execute]: false,
        [PosixPermission.Read]: true,
        [PosixPermission.Write]: false,
      },
    });
    expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
  });

  describe('group ace', () => {
    it('shows group combobox when Who is group', async () => {
      const groupSelect = await getGroupField();
      expect(groupSelect).toExist();
    });

    it('allows custom values in Group combobox', async () => {
      const userCombobox = await getGroupField();
      await userCombobox.setInputValue('AD\\domain users');
      await userCombobox.blur();

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAce).toHaveBeenLastCalledWith(
        expect.objectContaining({ who: 'AD\\domain users' }),
      );
      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });
  });

  describe('user ace', () => {
    it('shows user combobox when Who is user', async () => {
      const whoSelect = await loader.getHarness(TnSelectHarness);
      await whoSelect.selectOption(/^User$/);

      const userSelect = await getUserField();
      expect(userSelect).toExist();
    });

    it('allows custom values in User combobox', async () => {
      const whoSelect = await loader.getHarness(TnSelectHarness);
      await whoSelect.selectOption(/^User$/);

      const userCombobox = await getUserField();
      await userCombobox.setInputValue('AD\\administrator');
      await userCombobox.blur();

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAce).toHaveBeenLastCalledWith(
        expect.objectContaining({ who: 'AD\\administrator' }),
      );
      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });
  });

  describe('validation', () => {
    it('reports invalid when ace input changes to User tag with no user selected', () => {
      spectator.setInput('ace', {
        tag: PosixAclTag.User,
        who: undefined,
        perms: {
          [PosixPermission.Read]: true,
          [PosixPermission.Write]: false,
          [PosixPermission.Execute]: false,
        },
        default: false,
      } as PosixAclItem);

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(false);
    });

    it('reports invalid when ace input changes to Group tag with no group selected', () => {
      spectator.setInput('ace', {
        tag: PosixAclTag.Group,
        who: undefined,
        perms: {
          [PosixPermission.Read]: true,
          [PosixPermission.Write]: false,
          [PosixPermission.Execute]: false,
        },
        default: false,
      } as PosixAclItem);

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(false);
    });

    it('reports valid when ace input changes to Mask tag (no user/group required)', () => {
      spectator.setInput('ace', {
        tag: PosixAclTag.Mask,
        perms: {
          [PosixPermission.Read]: true,
          [PosixPermission.Write]: false,
          [PosixPermission.Execute]: false,
        },
        default: false,
      } as PosixAclItem);

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });

    it('reports valid when ace input changes to User tag with a user selected', () => {
      spectator.setInput('ace', {
        tag: PosixAclTag.User,
        who: 'root',
        perms: {
          [PosixPermission.Read]: true,
          [PosixPermission.Write]: false,
          [PosixPermission.Execute]: false,
        },
        default: false,
      } as PosixAclItem);

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });

    it('reports valid when ace input changes to Group tag with a group selected', () => {
      spectator.setInput('ace', {
        tag: PosixAclTag.Group,
        who: 'wheel',
        perms: {
          [PosixPermission.Read]: true,
          [PosixPermission.Write]: false,
          [PosixPermission.Execute]: false,
        },
        default: false,
      } as PosixAclItem);

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });
  });
});

describe('EditPosixAceComponent leaving an entry while its user is still being checked', () => {
  let spectator: Spectator<EditPosixAceComponent>;
  let loader: HarnessLoader;
  let store: DatasetAclEditorStore;
  let userExists$: ReplaySubject<boolean>;

  const perms = {
    [PosixPermission.Read]: true,
    [PosixPermission.Write]: false,
    [PosixPermission.Execute]: false,
  };
  const userWithoutName = { tag: PosixAclTag.User, default: false, perms } as PosixAclItem;
  const mask = { tag: PosixAclTag.Mask, default: false, perms } as PosixAclItem;

  const createComponent = createComponentFactory({
    component: EditPosixAceComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      DatasetAclEditorStore,
      mockProvider(TypedApiService),
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
    spectator.setInput('ace', acl.acl[selectedAceIndex] as PosixAclItem);
  }

  /** The existence check waits out a debounce before it asks the directory. */
  async function waitForExistenceCheck(): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, defaultDebounceTimeMs + 100);
    });
  }

  beforeEach(async () => {
    userExists$ = new ReplaySubject<boolean>(1);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store = spectator.inject(DatasetAclEditorStore);
    store.setState((state) => ({
      ...state,
      acl: { acltype: AclType.Posix1e, acl: [userWithoutName, mask] } as PosixAcl,
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

  it('starts with the first entry marked invalid and its check pending', () => {
    expect(store.state().acesWithError).toEqual([0]);
    expect(spectator.component.form.pending).toBe(true);
  });

  it('clears the error on the earlier entry once its check passes after Add Item', async () => {
    store.addAce();
    renderSelectedAce();
    userExists$.next(true);
    await waitForExistenceCheck();

    expect(store.state().selectedAceIndex).toBe(2);
    expect(store.state().acesWithError).toEqual([]);
  });

  it('clears the error on the earlier entry once its check passes after picking another in the list', async () => {
    // What `AclEditorListComponent.onAceSelected` does: no entry is selected for a moment, which removes this form,
    // and the picked one is selected in a later task, into a new form.
    store.selectAce(null);
    spectator.fixture.destroy();
    store.selectAce(1);
    userExists$.next(true);
    await waitForExistenceCheck();

    expect(store.state().acesWithError).toEqual([]);
  });

  it('keeps the earlier entry marked invalid when its user does not exist', async () => {
    store.addAce();
    renderSelectedAce();
    userExists$.next(false);
    await waitForExistenceCheck();

    expect(store.state().acesWithError).toEqual([0]);
  });
});

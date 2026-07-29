import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';
import { PosixAclItem } from 'app/interfaces/acl.interface';
import { User } from 'app/interfaces/user.interface';
import { IxComboboxHarness } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.harness';
import { IxPermissionsComponent } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { UserService } from 'app/services/user.service';
import { EditPosixAceComponent } from './edit-posix-ace.component';

describe('EditPosixAceComponent', () => {
  let spectator: Spectator<EditPosixAceComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
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

  beforeEach(async () => {
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
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows current ace values from ace input', async () => {
    const whoSelect = await loader.getHarness(TnSelectHarness);
    expect(await whoSelect.getDisplayText()).toBe('Group');

    const groupCombobox = await form.getControl('Group') as IxComboboxHarness;
    expect(await groupCombobox.getValue()).toBe('wheel');

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
      const groupSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
      expect(groupSelect).toExist();
    });

    it('allows custom values in Group combobox', async () => {
      const userCombobox = await form.getControl('Group') as IxComboboxHarness;
      await userCombobox.writeCustomValue('AD\\domain users');

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

      const userSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
      expect(userSelect).toExist();
    });

    it('allows custom values in User combobox', async () => {
      const whoSelect = await loader.getHarness(TnSelectHarness);
      await whoSelect.selectOption(/^User$/);

      const userCombobox = await form.getControl('User') as IxComboboxHarness;
      await userCombobox.writeCustomValue('AD\\administrator');

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

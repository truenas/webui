import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import {
  NfsAclTag, NfsAclType, NfsAdvancedFlag, NfsAdvancedPermission, NfsBasicFlag, NfsBasicPermission,
} from 'app/enums/nfs-acl.enum';
import { NfsAclItem } from 'app/interfaces/acl.interface';
import { User } from 'app/interfaces/user.interface';
import { IxCheckboxListHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.harness';
import { IxComboboxHarness } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.harness';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { UserService } from 'app/services/user.service';
import { EditNfsAceComponent } from './edit-nfs-ace.component';

describe('EditNfsAceComponent', () => {
  let spectator: Spectator<EditNfsAceComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: EditNfsAceComponent,
    imports: [
      ReactiveFormsModule,
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
      }),
    ],
  });

  beforeEach(async () => {
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
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows current ace values from ace input', async () => {
    const values = await form.getValues();

    expect(values).toEqual({
      Who: 'User',
      User: 'trunk',
      'ACL Type': 'Allow',
      'Permissions Type': 'Advanced',
      Permissions: [
        'Read Data',
        'Append Data',
        'Execute',
        'Read ACL',
      ],
      'Flags Type': 'Advanced',
      Flags: [
        'File Inherit',
        'Directory Inherit',
      ],
    });
  });

  it('updates value in store when form is updated', async () => {
    await form.fillForm(
      {
        'ACL Type': 'Deny',
        'Permissions Type': 'Basic',
        'Flags Type': 'Basic',
        Permissions: 'Full Control',
        Flags: 'Inherit',
      },
    );

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
      await form.fillForm({
        Who: 'User',
      });

      const userSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
      expect(userSelect).toExist();
    });

    it('allows custom values in User combobox', async () => {
      await form.fillForm({
        Who: 'User',
      });

      const userCombobox = await form.getControl('User') as IxComboboxHarness;
      await userCombobox.writeCustomValue('AD\\administrator');

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAce).toHaveBeenLastCalledWith(
        expect.objectContaining({ who: 'AD\\administrator' }),
      );
      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });
  });

  describe('group ace', () => {
    it('shows group combobox when Who is group', async () => {
      await form.fillForm({
        Who: 'Group',
      });

      const groupSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
      expect(groupSelect).toExist();
    });

    it('allows custom values in Group combobox', async () => {
      await form.fillForm({
        Who: 'Group',
      });

      const userCombobox = await form.getControl('Group') as IxComboboxHarness;
      await userCombobox.writeCustomValue('AD\\domain users');

      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAce).toHaveBeenLastCalledWith(
        expect.objectContaining({ who: 'AD\\domain users' }),
      );
      expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenLastCalledWith(true);
    });
  });

  it('shows basic permissions select when permission type is basic', async () => {
    await form.fillForm({
      'Permissions Type': 'Basic',
    });

    const permissionsSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Permissions' }));
    expect(permissionsSelect).toExist();
    const advancedFlagChecklist = await loader.getAllHarnesses(IxCheckboxListHarness.with({ label: 'Permissions' }));
    expect(advancedFlagChecklist).toHaveLength(0);
  });

  it('shows advanced permissions checkbox list when permission type is advanced', async () => {
    await form.fillForm({
      'Permissions Type': 'Advanced',
    });

    const advancedPermissionsChecklist = await loader.getHarness(IxCheckboxListHarness.with({ label: 'Permissions' }));
    expect(advancedPermissionsChecklist).toExist();

    const checkboxes = await advancedPermissionsChecklist.getCheckboxes();
    expect(checkboxes).toHaveLength(14);
  });

  it('shows basic flags when flag type is basic', async () => {
    await form.fillForm({
      'Flags Type': 'Basic',
    });

    const flagsRadioGroup = await loader.getHarness(IxRadioGroupHarness.with({ label: 'Flags' }));
    expect(flagsRadioGroup).toExist();
    const advancedFlagChecklist = await loader.getAllHarnesses(IxCheckboxListHarness.with({ label: 'Flags' }));
    expect(advancedFlagChecklist).toHaveLength(0);
  });

  it('shows advanced flags when flag type is advanced', async () => {
    await form.fillForm({
      'Flags Type': 'Advanced',
    });

    const advancedFlagChecklist = await loader.getHarness(IxCheckboxListHarness.with({ label: 'Flags' }));
    expect(advancedFlagChecklist).toExist();

    const checkboxes = await advancedFlagChecklist.getCheckboxes();
    expect(checkboxes).toHaveLength(5);
  });
});

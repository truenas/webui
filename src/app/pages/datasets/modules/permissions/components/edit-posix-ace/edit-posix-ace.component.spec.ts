import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
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
    const values = await form.getValues();

    expect(values).toEqual({
      Who: 'Group',
      Group: 'wheel',
      Permissions: [
        'Read',
        'Execute',
      ],
      Default: true,
    });
  });

  it('updates value in store when form is updated', async () => {
    await form.fillForm({
      Who: 'Mask',
      Permissions: ['Read'],
    });

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
});

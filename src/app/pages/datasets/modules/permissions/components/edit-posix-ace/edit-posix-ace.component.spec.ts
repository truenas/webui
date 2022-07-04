import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';
import { PosixAclItem } from 'app/interfaces/acl.interface';
import { User } from 'app/interfaces/user.interface';
import { IxComboboxHarness } from 'app/modules/ix-forms/components/ix-combobox/ix-combobox.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { UserService } from 'app/services';
import { EditPosixAceComponent } from './edit-posix-ace.component';

describe('EditPosixAceComponent', () => {
  let spectator: Spectator<EditPosixAceComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: EditPosixAceComponent,
    imports: [
      IxFormsModule,
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

  it('shows current ace values from ace @Input()', async () => {
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
    expect(spectator.inject(DatasetAclEditorStore).updateSelectedAceValidation).toHaveBeenCalled();
  });

  it('shows user combobox when Who is user', async () => {
    await form.fillForm({
      Who: 'User',
    });

    const userSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
    expect(userSelect).toExist();
  });

  it('shows group combobox when Who is group', async () => {
    await form.fillForm({
      Who: 'Group',
    });

    const groupSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
    expect(groupSelect).toExist();
  });
});

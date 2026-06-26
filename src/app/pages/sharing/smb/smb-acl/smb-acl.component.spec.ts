import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnSelectHarness } from '@truenas/ui-components';
import { of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { SmbSharesecPermission, SmbSharesecType } from 'app/enums/smb-sharesec.enum';
import { Group } from 'app/interfaces/group.interface';
import { SmbSharesec, SmbSharesecAce } from 'app/interfaces/smb-share.interface';
import { User, User as TnUser } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxComboboxHarness } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.harness';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserService } from 'app/services/user.service';
import { SmbAclComponent } from './smb-acl.component';

describe('SmbAclComponent', () => {
  let spectator: Spectator<SmbAclComponent>;
  let loader: HarnessLoader;
  let entriesList: IxListHarness;
  const mockAcl = {
    id: 13,
    share_name: 'myshare',
    share_acl: [
      {
        ae_who_sid: 'S-1-1-0',
        ae_type: SmbSharesecType.Allowed,
        ae_who_id: {
          id_type: NfsAclTag.Everyone,
        },
        ae_perm: SmbSharesecPermission.Read,
      } as SmbSharesecAce,
      {
        ae_who_sid: 'S-1-1-1',
        ae_type: SmbSharesecType.Denied,
        ae_perm: SmbSharesecPermission.Full,
        ae_who_id: {
          id_type: NfsAclTag.User,
          id: 3001,
        },
        ae_who_str: 'myuser',
      },
    ],
  } as SmbSharesec;

  const rootUser: Partial<TnUser> = {
    id: 0,
    uid: 0,
    username: 'root',
    smb: true,
  };

  const slideInRef: SlideInRef<string | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  /** All `tn-select`s bound to a given control, in DOM (list-item) order. */
  const getSelects = (controlName: string): Promise<TnSelectHarness[]> => loader.getAllHarnesses(
    TnSelectHarness.with({ selector: `[formControlName="${controlName}"]` }),
  );

  /** The `tn-select` for `controlName` belonging to the list item at `index`. */
  const getSelect = async (controlName: string, index: number): Promise<TnSelectHarness> => {
    const selects = await getSelects(controlName);
    return selects[index];
  };

  const createComponent = createComponentFactory({
    component: SmbAclComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('sharing.smb.getacl', mockAcl),
        mockCall('sharing.smb.setacl'),
        mockCall('user.query', [rootUser] as TnUser[]),
        mockCall('group.query', [{
          group: 'wheel', id: 1, gid: 1, smb: true,
        }] as Group[]),
      ]),
      mockProvider(SlideIn, {
        openSlideIns: jest.fn(() => 1),
      }),
      mockProvider(DialogService),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(UserService, {
        smbUserQueryDsCache: () => of([
          { username: 'root', id: 0, uid: 0 },
          { username: 'trunk' },
        ] as TnUser[]),
        smbGroupQueryDsCache: () => of([
          { group: 'wheel', id: 1, gid: 1 },
          { group: 'vip' },
        ]),
        getGroupByNameCached: (name: string) => {
          if (name === 'wheel') {
            return of({
              group: 'wheel', id: 1, gid: 1, name: 'wheel',
            } as Group);
          }
          return throwError(() => new Error('Group not found'));
        },
        getUserByNameCached: (username: string) => {
          if (username === 'root') {
            return of({ username: 'root', id: 0, uid: 0 } as User);
          }
          return throwError(() => new Error('User not found'));
        },
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      providers: [
        mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => 'myshare') }),
      ],
    });
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    entriesList = await loader.getHarness(IxListHarness);
  });

  it('shows name of the share in the title', () => {
    expect(spectator.query(ModalHeaderComponent)).toExist();
  });

  describe('user ace', () => {
    it('shows user combobox when Who is user', async () => {
      await entriesList.pressAddButton();
      const lastIndex = (await getSelects('ae_who')).length - 1;
      const whoSelect = await getSelect('ae_who', lastIndex);
      await whoSelect.selectOption('User');

      const userSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
      expect(userSelect).toExist();

      const entries = spectator.component.form.value.entries;
      expect(entries[entries.length - 1]).toEqual(
        expect.not.objectContaining({ user: 0 }),
      );
    });

    it('allows custom values in User combobox', async () => {
      const lastIndex = (await getSelects('ae_who')).length - 1;
      const whoSelect = await getSelect('ae_who', lastIndex);
      await whoSelect.selectOption('User');

      const userCombobox = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
      await userCombobox.writeCustomValue('root');

      // Wait for debounced value update and autocomplete resolution
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 400);
      });
      spectator.detectChanges();

      const userSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
      expect(userSelect).toExist();

      const entries = spectator.component.form.value.entries;
      expect(entries[entries.length - 1]).toEqual(
        expect.objectContaining({ user: 0 }),
      );
    });
  });

  describe('group ace', () => {
    it('shows group combobox when Who is group', async () => {
      await entriesList.pressAddButton();
      const lastIndex = (await getSelects('ae_who')).length - 1;
      const whoSelect = await getSelect('ae_who', lastIndex);
      await whoSelect.selectOption('Group');

      const groupSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
      expect(groupSelect).toExist();

      const entries = spectator.component.form.value.entries;
      expect(entries[entries.length - 1]).toEqual(
        expect.not.objectContaining({ group: 1 }),
      );
    });

    it('allows custom values in Group combobox', async () => {
      const lastIndex = (await getSelects('ae_who')).length - 1;
      const whoSelect = await getSelect('ae_who', lastIndex);
      await whoSelect.selectOption('Group');

      const groupCombobox = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
      await groupCombobox.writeCustomValue('wheel');

      // Wait for debounced value update and autocomplete resolution
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 400);
      });
      spectator.detectChanges();

      const groupSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
      expect(groupSelect).toExist();

      const entries = spectator.component.form.value.entries;
      expect(entries[entries.length - 1]).toEqual(
        expect.objectContaining({ group: 1 }),
      );
    });
  });

  it('loads and shows current acl for a share', async () => {
    expect(spectator.inject(ApiService).call)
      .toHaveBeenCalledWith('sharing.smb.getacl', [{ share_name: 'myshare' }]);

    const whoSelects = await getSelects('ae_who');
    const permSelects = await getSelects('ae_perm');
    const typeSelects = await getSelects('ae_type');

    expect(await whoSelects[0].getDisplayText()).toBe('everyone@');
    expect(await permSelects[0].getDisplayText()).toBe('READ');
    expect(await typeSelects[0].getDisplayText()).toBe('ALLOWED');

    expect(await whoSelects[1].getDisplayText()).toBe('User');
    expect(await permSelects[1].getDisplayText()).toBe('FULL');
    expect(await typeSelects[1].getDisplayText()).toBe('DENIED');

    const userCombobox = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
    expect(await userCombobox.getValue()).toBe('3001');
  });

  it('saves updated acl when form is submitted', async () => {
    // The <ix-form> wrapper emits a dev-mode advisory warning when the form has a nested
    // FormArray (entries); the payload here is built from form.value, so it's benign.
    jest.spyOn(console, 'warn').mockImplementation();

    await entriesList.pressAddButton();
    const lastIndex = (await getSelects('ae_who')).length - 1;

    await (await getSelect('ae_who', lastIndex)).selectOption('Group');

    const groupCombobox = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
    await groupCombobox.setValue('wheel');

    await (await getSelect('ae_perm', lastIndex)).selectOption('FULL');
    await (await getSelect('ae_type', lastIndex)).selectOption('ALLOWED');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('sharing.smb.setacl', [{
      share_name: 'myshare',
      share_acl: [
        { ae_perm: SmbSharesecPermission.Read, ae_type: SmbSharesecType.Allowed, ae_who_sid: 'S-1-1-0' },
        {
          ae_perm: SmbSharesecPermission.Full,
          ae_type: SmbSharesecType.Denied,
          ae_who_id: {
            id: 3001,
            id_type: 'USER',
          },
        },
        {
          ae_perm: SmbSharesecPermission.Full,
          ae_type: SmbSharesecType.Allowed,
          ae_who_id: { id_type: NfsAclTag.UserGroup, id: 1 },
        },
      ],
    }]);

    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });
});

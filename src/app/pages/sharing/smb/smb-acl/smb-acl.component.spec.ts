import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ComboboxQueryType } from 'app/enums/combobox.enum';
import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { SmbSharesecPermission, SmbSharesecType } from 'app/enums/smb-sharesec.enum';
import { Group } from 'app/interfaces/group.interface';
import { SmbSharesec, SmbSharesecAce } from 'app/interfaces/smb-share.interface';
import { User, User as TnUser } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { GroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/group-combobox-provider';
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

  const mockUser3001: Partial<TnUser> = {
    id: 3001,
    uid: 3001,
    username: 'myuser',
    smb: true,
  };

  const slideInRef: SlideInRef<string | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
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
        mockCall('user.query', (params) => {
          // Handle different query filters
          const filters = params[0] as unknown[][];
          const uidFilter = filters?.find((filter) => filter[0] === 'uid');
          if (uidFilter && uidFilter[2] === 3001) {
            return [mockUser3001] as TnUser[];
          }
          return [rootUser] as TnUser[];
        }),
        mockCall('group.query', (params) => {
          // Handle different query filters for group lookups
          const filters = params[0] as unknown[][];
          const nameFilter = filters?.find((filter) => filter[0] === 'name');
          if (nameFilter && nameFilter[2] === 'wheel') {
            return [{
              group: 'wheel', id: 1, gid: 1, name: 'wheel', smb: true,
            }] as Group[];
          }
          return [{
            group: 'wheel', id: 1, gid: 1, smb: true,
          }] as Group[];
        }),
      ]),
      mockProvider(SlideIn),
      mockProvider(DialogService),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(UserService, {
        smbUserQueryDsCache: () => of([
          { username: 'root', id: 0, uid: 0 },
          { username: 'trunk' },
        ] as User[]),
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
        isGroupInAutocompleteCache: jest.fn(() => false),
        isGroupCachedAsNonExistent: jest.fn(() => false),
        recordGroupAsNonExistent: jest.fn(),
        isUserInAutocompleteCache: jest.fn(() => false),
        isUserCachedAsNonExistent: jest.fn(() => false),
        recordUserAsNonExistent: jest.fn(),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      providers: [
        mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => 'myshare') }),
      ],
    });

    // Immediately set groupProvider before any async operations to properly render group combobox controls
    const componentWithGroupProvider = spectator.component as unknown as { groupProvider: GroupComboboxProvider };
    componentWithGroupProvider.groupProvider = new GroupComboboxProvider(
      spectator.inject(UserService),
      {
        initialOptions: [],
        valueField: 'gid',
        queryType: ComboboxQueryType.Smb,
      },
    );

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    // Wait for extractOptionFromAcl to complete
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 500);
    });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    entriesList = await loader.getHarness(IxListHarness);
  });

  it('shows name of the share in the title', () => {
    expect(spectator.query(ModalHeaderComponent)).toExist();
  });

  describe('user ace', () => {
    it('shows user combobox when Who is user', async () => {
      await entriesList.pressAddButton();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      const newListItem = await entriesList.getLastListItem();
      await newListItem.fillForm({
        Who: 'User',
      });

      const userSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
      expect(userSelect).toExist();

      const entries = spectator.component.form.value.entries;
      expect(entries[entries.length - 1]).toEqual(
        expect.not.objectContaining({ user: 0 }),
      );
    });

    it('allows custom values in User combobox', async () => {
      const newListItem = await entriesList.getLastListItem();
      await newListItem.fillForm({
        Who: 'User',
      });

      const fields = await newListItem.getControlHarnessesDict();

      const userCombobox = fields['User'] as IxComboboxHarness;
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
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      const newListItem = await entriesList.getLastListItem();
      await newListItem.fillForm({
        Who: 'Group',
      });
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      const groupSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
      expect(groupSelect).toExist();

      const entries = spectator.component.form.value.entries;
      expect(entries[entries.length - 1]).toEqual(
        expect.not.objectContaining({ group: 1 }),
      );
    });

    it('allows custom values in Group combobox', async () => {
      const newListItem = await entriesList.getLastListItem();
      await newListItem.fillForm({
        Who: 'Group',
      });
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      const fields = await newListItem.getControlHarnessesDict();

      const groupCombobox = fields['Group'] as IxComboboxHarness;
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
    const listValues = await entriesList.getFormValues();

    expect(spectator.inject(ApiService).call)
      .toHaveBeenCalledWith('sharing.smb.getacl', [{ share_name: 'myshare' }]);

    expect(listValues).toEqual([
      {
        Permission: 'READ',
        Type: 'ALLOWED',
        Who: 'everyone@',
      },
      {
        Who: 'User',
        User: '3001',
        Permission: 'FULL',
        Type: 'DENIED',
      },
    ]);
  });

  it('saves updated acl when form is submitted', async () => {
    const api = spectator.inject(ApiService);

    await entriesList.pressAddButton();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
    const newListItem = await entriesList.getLastListItem();
    await newListItem.fillForm({
      Who: 'Group',
      Permission: 'FULL',
      Type: 'ALLOWED',
    });
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    await newListItem.fillForm({ Group: 'wheel' });

    // Wait for async validation to complete (300ms debounce + buffer)
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 600);
    });
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(false);
    await saveButton.click();
    await spectator.fixture.whenStable();

    expect(api.call).toHaveBeenCalledWith('sharing.smb.setacl', [{
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

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { of, throwError } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
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
      mockProvider(SlideIn),
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
      const entries = spectator.component.form.controls.entries;
      entries.at(entries.length - 1).controls.ae_who.setValue(NfsAclTag.User);
      spectator.detectChanges();

      const userSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
      expect(userSelect).toExist();

      const entryValues = spectator.component.form.value.entries;
      expect(entryValues[entryValues.length - 1]).toEqual(
        expect.not.objectContaining({ user: 0 }),
      );
    });

    it('allows custom values in User combobox', async () => {
      const entries = spectator.component.form.controls.entries;
      entries.at(entries.length - 1).controls.ae_who.setValue(NfsAclTag.User);
      spectator.detectChanges();

      const userCombobox = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
      await userCombobox.writeCustomValue('root');

      // Wait for debounced value update and autocomplete resolution
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 400);
      });
      spectator.detectChanges();

      const userSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
      expect(userSelect).toExist();

      const entryValues = spectator.component.form.value.entries;
      expect(entryValues[entryValues.length - 1]).toEqual(
        expect.objectContaining({ user: 0 }),
      );
    });
  });

  describe('group ace', () => {
    it('shows group combobox when Who is group', async () => {
      await entriesList.pressAddButton();
      const entries = spectator.component.form.controls.entries;
      entries.at(entries.length - 1).controls.ae_who.setValue(NfsAclTag.UserGroup);
      spectator.detectChanges();

      const groupSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
      expect(groupSelect).toExist();

      const entryValues = spectator.component.form.value.entries;
      expect(entryValues[entryValues.length - 1]).toEqual(
        expect.not.objectContaining({ group: 1 }),
      );
    });

    it('allows custom values in Group combobox', async () => {
      const entries = spectator.component.form.controls.entries;
      entries.at(entries.length - 1).controls.ae_who.setValue(NfsAclTag.UserGroup);
      spectator.detectChanges();

      const groupCombobox = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
      await groupCombobox.writeCustomValue('wheel');

      // Wait for debounced value update and autocomplete resolution
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 400);
      });
      spectator.detectChanges();

      const groupSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
      expect(groupSelect).toExist();

      const entryValues = spectator.component.form.value.entries;
      expect(entryValues[entryValues.length - 1]).toEqual(
        expect.objectContaining({ group: 1 }),
      );
    });
  });

  it('loads and shows current acl for a share', () => {
    expect(spectator.inject(ApiService).call)
      .toHaveBeenCalledWith('sharing.smb.getacl', [{ share_name: 'myshare' }]);

    const entryValues = spectator.component.form.value.entries;
    expect(entryValues).toEqual([
      expect.objectContaining({
        ae_who_sid: 'S-1-1-0',
        ae_who: NfsAclTag.Everyone,
        ae_perm: SmbSharesecPermission.Read,
        ae_type: SmbSharesecType.Allowed,
      }),
      expect.objectContaining({
        ae_who: NfsAclTag.User,
        ae_perm: SmbSharesecPermission.Full,
        ae_type: SmbSharesecType.Denied,
      }),
    ]);
  });

  it('saves updated acl when form is submitted', async () => {
    await entriesList.pressAddButton();
    const entries = spectator.component.form.controls.entries;
    const lastEntry = entries.at(entries.length - 1);
    lastEntry.patchValue({
      ae_who: NfsAclTag.UserGroup,
      ae_perm: SmbSharesecPermission.Full,
      ae_type: SmbSharesecType.Allowed,
      group: 1,
    });
    spectator.detectChanges();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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

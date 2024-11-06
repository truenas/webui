import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { User } from '@sentry/angular';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { SmbSharesecPermission, SmbSharesecType } from 'app/enums/smb-sharesec.enum';
import { Group } from 'app/interfaces/group.interface';
import { SmbSharesec } from 'app/interfaces/smb-share.interface';
import { User as TnUser } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxComboboxHarness } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.harness';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SlideInService } from 'app/services/slide-in.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';
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
          id: null,
        },
        ae_perm: SmbSharesecPermission.Read,
      },
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

  const createComponent = createComponentFactory({
    component: SmbAclComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('sharing.smb.getacl', mockAcl),
        mockCall('sharing.smb.setacl'),
        mockCall('user.query', [rootUser] as TnUser[]),
        mockCall('group.query', [{
          group: 'wheel', id: 1, gid: 1, smb: true,
        }] as Group[]),
      ]),
      mockProvider(SlideInService),
      mockProvider(DialogService),
      mockProvider(SlideInRef),
      mockProvider(UserService, {
        smbUserQueryDsCache: () => of([
          { username: 'root', id: 0, uid: 0 },
          { username: 'trunk' },
        ] as User[]),
        smbGroupQueryDsCache: () => of([
          { group: 'wheel', id: 1, gid: 1 },
          { group: 'vip' },
        ]),
      }),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      providers: [
        { provide: SLIDE_IN_DATA, useValue: 'myshare' },
      ],
    });
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    entriesList = await loader.getHarness(IxListHarness);
  });

  it('shows name of the share in the title', () => {
    const title = spectator.query('ix-modal-header');
    expect(title).toHaveText('Share ACL for myshare');
  });

  describe('user ace', () => {
    it('shows user combobox when Who is user', async () => {
      await entriesList.pressAddButton();
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
      const newListItem = await entriesList.getLastListItem();
      await newListItem.fillForm({
        Who: 'Group',
      });

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

      const fields = await newListItem.getControlHarnessesDict();

      const groupCombobox = fields['Group'] as IxComboboxHarness;
      await groupCombobox.writeCustomValue('wheel');

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

    expect(spectator.inject(WebSocketService).call)
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
    await entriesList.pressAddButton();
    const newListItem = await entriesList.getLastListItem();
    await newListItem.fillForm(
      {
        Who: 'Group',
        Permission: 'FULL',
        Type: 'ALLOWED',
        Group: 'wheel',
      },
    );

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('sharing.smb.setacl', [{
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

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SmbSharesecPermission, SmbSharesecType } from 'app/enums/smb-sharesec.enum';
import { SmbSharesec } from 'app/interfaces/smb-share.interface';
import { IxListHarness } from 'app/modules/ix-forms/components/ix-list/ix-list.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SmbAclComponent } from './smb-acl.component';

describe('SmbAclComponent', () => {
  let spectator: Spectator<SmbAclComponent>;
  let loader: HarnessLoader;
  let entriesList: IxListHarness;
  const createComponent = createComponentFactory({
    component: SmbAclComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('smb.sharesec.query', [
          {
            id: 13,
            share_name: 'myshare',
            share_acl: [
              {
                ae_who_sid: 'S-1-1-0',
                ae_type: SmbSharesecType.Allowed,
                ae_who_name: {
                  name: 'Everyone',
                },
                ae_perm: SmbSharesecPermission.Read,
              },
              {
                ae_who_sid: 'S-1-1-1',
                ae_type: SmbSharesecType.Denied,
                ae_perm: SmbSharesecPermission.Full,
                ae_who_name: {
                  name: 'John',
                },
              },
            ],
          },
        ] as SmbSharesec[]),
        mockCall('smb.sharesec.update'),
      ]),
      mockProvider(IxSlideInService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    spectator.component.setSmbShareName('myshare');
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    entriesList = await loader.getHarness(IxListHarness);
  });

  it('shows name of the share in the title', () => {
    const title = spectator.query('ix-modal-header');
    expect(title).toHaveText('Share ACL for myshare');
  });

  it('loads and shows current acl for a share', async () => {
    const listValues = await entriesList.getFormValues();

    expect(spectator.inject(WebSocketService).call)
      .toHaveBeenCalledWith('smb.sharesec.query', [[['share_name', '=', 'myshare']]]);
    expect(listValues).toEqual([
      {
        Domain: '',
        Name: 'Everyone',
        Permission: 'READ',
        SID: 'S-1-1-0',
        Type: 'ALLOWED',
      },
      {
        Domain: '',
        Name: 'John',
        Permission: 'FULL',
        SID: 'S-1-1-1',
        Type: 'DENIED',
      },
    ]);
  });

  it('saves updated acl when form is submitted', async () => {
    await entriesList.pressAddButton();
    const newListItem = await entriesList.getLastListItem();
    await newListItem.fillForm({
      Domain: '//freenas/users',
      Name: 'John',
      Permission: 'FULL',
      Type: 'ALLOWED',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smb.sharesec.update', [13, {
      share_acl: [
        { ae_perm: SmbSharesecPermission.Read, ae_type: SmbSharesecType.Allowed, ae_who_sid: 'S-1-1-0' },
        { ae_perm: SmbSharesecPermission.Full, ae_type: SmbSharesecType.Denied, ae_who_sid: 'S-1-1-1' },
        {
          ae_perm: SmbSharesecPermission.Full,
          ae_type: SmbSharesecType.Allowed,
          ae_who_name: { domain: '//freenas/users', name: 'John' },
        },
      ],
    }]);

    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('requires either SID or domain + name to be validated', async () => {
    await entriesList.pressAddButton();
    const newListItem = await entriesList.getLastListItem();
    await newListItem.fillForm({
      Domain: '//freenas/users',
    });

    expect(await (await newListItem.host()).text())
      .toContain('Either SID or Domain Name + Name are required.');
  });
});

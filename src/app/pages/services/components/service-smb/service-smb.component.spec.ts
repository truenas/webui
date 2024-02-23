import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SmbConfig } from 'app/interfaces/smb-config.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ServiceSmbComponent', () => {
  let spectator: Spectator<ServiceSmbComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createRoutingFactory({
    component: ServiceSmbComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('smb.config', {
          id: 1,
          netbiosname: 'truenas',
          netbiosalias: [],
          workgroup: 'WORKGROUP',
          description: 'TrueNAS Server',
          unixcharset: 'UTF-8',
          loglevel: 'MINIMUM',
          syslog: false,
          aapl_extensions: false,
          localmaster: true,
          guest: 'nobody',
          filemask: '',
          dirmask: '',
          bindip: [],
          cifs_SID: 'mockSid',
          ntlmv1_auth: false,
          enable_smb1: false,
          admin_group: null,
          next_rid: 0,
          multichannel: false,
          netbiosname_local: 'truenas',
        } as SmbConfig),
        mockCall('smb.unixcharset_choices', {
          'UTF-8': 'UTF-8',
          'UTF-16': 'UTF-16',
        }),
        mockCall('smb.bindip_choices', {
          '1.1.1.1': '1.1.1.1',
          '2.2.2.2': '2.2.2.2',
        }),
        mockCall('smb.update'),
        mockCall('failover.licensed', false),
        mockCall(
          'user.query',
          [
            { id: 41, username: 'dummy-user' },
            { id: 42, username: 'second-user' },
          ] as User[],
        ),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(Router),
      mockProvider(DialogService),
      mockProvider(SystemGeneralService),
      mockProvider(UserService, {
        groupQueryDsCache: jest.fn(() => of([{
          group: 'test-group',
        }])),
        userQueryDsCache: jest.fn(() => of([{
          username: 'test-username',
        }])),
      }),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads and shows current settings for Smb service when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('smb.config');
    expect(values).toEqual({
      'NetBIOS Name': 'truenas',
      'NetBIOS Alias': [],
      Workgroup: 'WORKGROUP',
      Description: 'TrueNAS Server',
      'Enable SMB1 support': false,
      'NTLMv1 Auth': false,
    });
  });

  it('shows advanced settings when Advanced Settings button is pressed', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
    await advancedButton.click();

    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Administrators Group': '',
      'Bind IP Addresses': [],
      Description: 'TrueNAS Server',
      'Directory Mask': '',
      'Enable Apple SMB2/3 Protocol Extensions': false,
      'Enable SMB1 support': false,
      'File Mask': '',
      'Guest Account': '',
      'Local Master': true,
      'Log Level': 'Minimum',
      'NTLMv1 Auth': false,
      'NetBIOS Alias': [],
      'NetBIOS Name': 'truenas',
      Multichannel: false,
      'UNIX Charset': 'UTF-8',
      'Use Syslog Only': false,
      Workgroup: 'WORKGROUP',
    });
  });

  it('sends an update payload to websocket when basic form is filled and saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'NetBIOS Name': 'truenas-scale',
      'NetBIOS Alias': ['truenas-alias', 'truenas-alias2'],
      Description: 'TrueNAS SCALE Server',
      'Enable SMB1 support': true,
      'NTLMv1 Auth': true,
      Workgroup: 'WORKGROUP2',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenLastCalledWith('smb.update', [{
      // New basic options
      netbiosname: 'truenas-scale',
      netbiosalias: ['truenas-alias', 'truenas-alias2'],
      description: 'TrueNAS SCALE Server',
      enable_smb1: true,
      ntlmv1_auth: true,
      workgroup: 'WORKGROUP2',

      // Old advanced options
      aapl_extensions: false,
      admin_group: null,
      bindip: [],
      guest: 'nobody',
      dirmask: '',
      filemask: '',
      loglevel: 'MINIMUM',
      localmaster: true,
      syslog: false,
      multichannel: false,
      unixcharset: 'UTF-8',
    }]);
  });

  it('sends an update payload to websocket when advanced form is filled and saved', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
    await advancedButton.click();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'UNIX Charset': 'UTF-16',
      'Log Level': 'Full',
      'Use Syslog Only': true,
      'Local Master': false,
      'Enable Apple SMB2/3 Protocol Extensions': true,
      'Administrators Group': 'test-group',
      'File Mask': '0666',
      'Directory Mask': '0777',
      'Bind IP Addresses': ['1.1.1.1', '2.2.2.2'],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenLastCalledWith('smb.update', [{
      // Old basic options
      netbiosname: 'truenas',
      netbiosalias: [],
      description: 'TrueNAS Server',
      enable_smb1: false,
      ntlmv1_auth: false,
      workgroup: 'WORKGROUP',

      // New advanced options
      aapl_extensions: true,
      admin_group: 'test-group',
      bindip: ['1.1.1.1', '2.2.2.2'],
      guest: 'nobody',
      dirmask: '0777',
      filemask: '0666',
      loglevel: 'FULL',
      localmaster: false,
      syslog: true,
      multichannel: false,
      unixcharset: 'UTF-16',
    }]);
  });
});

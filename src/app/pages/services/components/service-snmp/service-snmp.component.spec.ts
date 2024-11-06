import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SnmpConfig } from 'app/interfaces/snmp-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { WebSocketService } from 'app/services/ws.service';
import { ServiceSnmpComponent } from './service-snmp.component';

describe('ServiceSnmpComponent', () => {
  let spectator: Spectator<ServiceSnmpComponent>;
  let websocket: WebSocketService;
  let loader: HarnessLoader;
  const createComponent = createRoutingFactory({
    component: ServiceSnmpComponent,
    imports: [
      ReactiveFormsModule,
    ],
    routes: [],
    providers: [
      mockProvider(DialogService),
      mockWebSocket([
        mockCall('snmp.update'),
        mockCall('snmp.config', {
          location: 'My location',
          contact: 'test@truenas.org',
          community: 'gated',
          v3: true,
          v3_username: 'john',
          v3_authtype: 'MD5',
          v3_password: '12345678',
          v3_privproto: 'AES',
          v3_privpassphrase: '87654321',
          options: 'leave_pidfile=true',
          zilstat: true,
          loglevel: 4,
        } as SnmpConfig),
      ]),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    websocket = spectator.inject(WebSocketService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads and shows current SNMP settings', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(websocket.call).toHaveBeenCalledWith('snmp.config');
    expect(values).toEqual({
      Location: 'My location',
      Contact: 'test@truenas.org',
      Community: 'gated',

      'SNMP v3 Support': true,
      Username: 'john',
      'Authentication Type': 'MD5',
      Password: '12345678',
      'Privacy Protocol': 'AES',
      'Privacy Passphrase': '87654321',

      'Auxiliary Parameters': 'leave_pidfile=true',
      'Expose zilstat via SNMP': true,
      'Log Level': 'Warning',
    });
  });

  it('saves SNMP settings when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Location: 'New location',
      Contact: 'contact@truenas.org',
      Community: 'public',

      'SNMP v3 Support': true,
      Username: 'will',
      'Authentication Type': 'SHA',
      Password: 'abcd1234',
      'Privacy Protocol': 'DES',
      'Privacy Passphrase': '4321dcba',

      'Auxiliary Parameters': 'leave_pidfile=false',
      'Expose zilstat via SNMP': false,
      'Log Level': 'Error',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith('snmp.update', [{
      location: 'New location',
      contact: 'contact@truenas.org',
      community: 'public',

      v3: true,
      v3_username: 'will',
      v3_authtype: 'SHA',
      v3_password: 'abcd1234',
      v3_privproto: 'DES',
      v3_privpassphrase: '4321dcba',

      options: 'leave_pidfile=false',
      zilstat: false,
      loglevel: 3,
    }]);
  });

  it('does not show v3 fields if SNMP v3 Support checkbox is off', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'SNMP v3 Support': false,
    });

    const labels = await form.getLabels();
    expect(labels).not.toContain('Username');
    expect(labels).not.toContain('Authentication Type');
    expect(labels).not.toContain('Password');
    expect(labels).not.toContain('Privacy Protocol');
    expect(labels).not.toContain('Privacy Passphrase');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith('snmp.update', [
      expect.objectContaining({
        v3: false,
        v3_username: '',
        v3_authtype: '',
        v3_password: '',
        v3_privproto: null,
        v3_privpassphrase: '',
      }),
    ]);
  });
});

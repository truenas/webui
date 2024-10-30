import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog/syslog-form/syslog-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('SyslogFormComponent', () => {
  let spectator: Spectator<SyslogFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: SyslogFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('system.advanced.config', {
          fqdn_syslog: true,
          sysloglevel: SyslogLevel.Error,
          syslogserver: 'existing.server.com',
          syslog_transport: SyslogTransport.Udp,
          syslog_tls_certificate: 2,
        } as AdvancedConfig),
        mockCall('system.advanced.syslog_certificate_choices', {
          1: 'Certificate 1',
          2: 'Certificate 2',
        }),
        mockCall('system.advanced.syslog_certificate_authority_choices', {
          1: 'Authority 1',
          2: 'Authority 2',
        }),
        mockCall('system.advanced.update'),
        mockJob('systemdataset.update'),
      ]),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
        components$: of([]),
      }),
      mockProvider(DialogService),
      provideMockStore(),
      mockProvider(ChainedRef, {
        close: jest.fn(),
        getData: jest.fn(() => ({
          fqdn_syslog: true,
          sysloglevel: SyslogLevel.Error,
          syslogserver: 'existing.server.com',
          syslog_transport: SyslogTransport.Udp,
          syslog_tls_certificate: 2,
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads current settings for syslog form and shows them', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Use FQDN for Logging': true,
      'Syslog Level': 'Error',
      'Syslog Server': 'existing.server.com',
      'Syslog Transport': 'UDP',
      'Include Audit Logs': false,
    });
  });

  it('saves both advanced config and dataset config when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Use FQDN for Logging': false,
      'Syslog Level': 'Info',
      'Syslog Server': 'new.server.com',
      'Syslog Transport': SyslogTransport.Tcp,
      'Include Audit Logs': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('system.advanced.update', [
      {
        fqdn_syslog: false,
        sysloglevel: SyslogLevel.Info,
        syslogserver: 'new.server.com',
        syslog_transport: SyslogTransport.Tcp,
        syslog_audit: true,
      },
    ]);
  });

  it('shows certificate fields when transport is TLS and saves it', async () => {
    const form = await loader.getHarness(IxFormHarness);

    await form.fillForm(
      {
        'Syslog Transport': SyslogTransport.Tls,
        'Syslog TLS Certificate': 'Certificate 2',
        'Syslog TLS Certificate Authority': 'Authority 2',
      },
    );

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('system.advanced.update', [
      expect.objectContaining({
        syslog_transport: SyslogTransport.Tls,
        syslog_tls_certificate: 2,
        syslog_tls_certificate_authority: 2,
      }),
    ]);
  });
});

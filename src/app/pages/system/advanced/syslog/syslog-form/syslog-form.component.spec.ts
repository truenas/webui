import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog/syslog-form/syslog-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('SyslogFormComponent', () => {
  let spectator: Spectator<SyslogFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: SyslogFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('system.advanced.config', {
          fqdn_syslog: true,
          sysloglevel: SyslogLevel.Error,
          syslogserver: 'existing.server.com',
          syslog_transport: SyslogTransport.Udp,
          syslog_tls_certificate: 2,
        } as AdvancedConfig),
        mockCall('systemdataset.config', {
          syslog: true,
        } as SystemDatasetConfig),
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
      mockProvider(IxSlideInService),
      mockProvider(DialogService),
      provideMockStore(),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
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

    expect(ws.call).toHaveBeenCalledWith('system.advanced.config');
    expect(ws.call).toHaveBeenCalledWith('systemdataset.config');
    expect(values).toEqual({
      'Use FQDN for Logging': true,
      'Syslog Level': 'Error',
      'Syslog Server': 'existing.server.com',
      'Syslog Transport': 'UDP',
      'Use System Dataset': true,
    });
  });

  it('saves both advanced config and dataset config when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Use FQDN for Logging': false,
      'Syslog Level': 'Info',
      'Syslog Server': 'new.server.com',
      'Syslog Transport': SyslogTransport.Tcp,
      'Use System Dataset': false,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('system.advanced.update', [
      {
        fqdn_syslog: false,
        sysloglevel: SyslogLevel.Info,
        syslogserver: 'new.server.com',
        syslog_transport: SyslogTransport.Tcp,
      },
    ]);
    expect(ws.job).toHaveBeenCalledWith('systemdataset.update', [{ syslog: false }]);
  });

  it('shows certificate fields when transport is TLS and saves it', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Syslog Transport': SyslogTransport.Tls,
    });
    await form.fillForm({
      'Syslog TLS Certificate': 'Certificate 2',
      'Syslog TLS Certificate Authority': 'Authority 2',
    });

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

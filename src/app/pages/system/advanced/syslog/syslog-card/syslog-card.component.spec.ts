import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SyslogCardComponent } from 'app/pages/system/advanced/syslog/syslog-card/syslog-card.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('SyslogCardComponent', () => {
  let spectator: Spectator<SyslogCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SyslogCardComponent,
    imports: [
      MapValuePipe,
      YesNoPipe,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('system.advanced.syslog_certificate_choices', {
          1: 'Certificate 1',
          2: 'Certificate 2',
        }),
        mockCall('system.advanced.syslog_certificate_authority_choices', {
          1: 'Authority 1',
          2: 'Authority 2',
        }),
        mockCall('system.advanced.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              fqdn_syslog: true,
              sysloglevel: SyslogLevel.Alert,
              syslog_audit: false,
              syslogservers: [
                {
                  host: '127.1.2.3',
                  transport: SyslogTransport.Tcp,
                },
              ],
            } as AdvancedConfig,
          },
        ],
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows syslog related settings', () => {
    const items = spectator.queryAll('.details-item');
    const itemTexts = items.map((item) => item.textContent.replace(/\s+/g, ' ').trim());

    expect(itemTexts).toEqual([
      'Use FQDN for Logging: Enabled',
      'Syslog Level: Alert',
      'Syslog Servers: 127.1.2.3 (TCP)',
      'Include Audit Logs: No',
    ]);
  });

  it('opens the Syslog form in a side panel when Configure is pressed', async () => {
    expect(spectator.query('ix-syslog-form')).toBeNull();

    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();
    spectator.detectChanges();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.query('ix-syslog-form')).not.toBeNull();
  });

  it('displays multiple syslog servers correctly', () => {
    // Access protected method via bracket notation
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const formatMethod = spectator.component['formatSyslogServers'];
    const result = formatMethod.call(spectator.component, {
      syslogservers: [
        { host: 'server1.com', transport: SyslogTransport.Udp },
        { host: 'server2.com', transport: SyslogTransport.Tls },
      ],
    });

    expect(result).toBe('server1.com (UDP), server2.com (TLS)');
  });

  it('displays "None" when no syslog servers are configured', () => {
    // Access protected method via bracket notation
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const formatMethod = spectator.component['formatSyslogServers'];
    const result = formatMethod.call(spectator.component, {
      syslogservers: [],
    });

    expect(result).toBe('None');
  });
});

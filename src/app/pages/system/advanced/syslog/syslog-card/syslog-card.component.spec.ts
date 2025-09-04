import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SyslogCardComponent } from 'app/pages/system/advanced/syslog/syslog-card/syslog-card.component';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog/syslog-form/syslog-form.component';
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
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows syslog related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Use FQDN for Logging: Enabled',
      'Syslog Level: Alert',
      'Syslog Servers: 127.1.2.3 (TCP)',
      'Include Audit Logs: No',
    ]);
  });


  it('opens Syslog form when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      SyslogFormComponent,
      {
        data: {
          fqdn_syslog: true,
          syslog_audit: false,
          sysloglevel: 'F_ALERT',
          syslogservers: [
            {
              host: '127.1.2.3',
              transport: 'TCP',
            },
          ],
        },
      },
    );
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

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
import { SyslogCardComponent } from 'app/pages/system/advanced/syslog/syslog-card/syslog-card.component';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog/syslog-form/syslog-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
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
              syslogserver: '127.1.2.3',
              sysloglevel: SyslogLevel.Alert,
              syslog_transport: SyslogTransport.Tcp,
              syslog_audit: false,
            } as AdvancedConfig,
          },
        ],
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
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
      'Syslog Server: 127.1.2.3',
      'Syslog Transport: TCP',
      'Include Audit Logs: No',
    ]);
  });

  it('opens Syslog form when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(
      SyslogFormComponent,
      false,
      {
        fqdn_syslog: true,
        syslog_audit: false,
        syslog_tls_certificate: undefined,
        syslog_tls_certificate_authority: undefined,
        syslog_transport: 'TCP',
        sysloglevel: 'F_ALERT',
        syslogserver: '127.1.2.3',
      },
    );
  });
});

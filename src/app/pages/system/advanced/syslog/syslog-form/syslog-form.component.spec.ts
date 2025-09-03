import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { FormBuilder } from '@ngneat/reactive-forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog/syslog-form/syslog-form.component';

describe('SyslogFormComponent', () => {
  let spectator: Spectator<SyslogFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  // Helper to check FormArray length since toHaveLength doesn't work with @ngneat/reactive-forms FormArray
  const expectArrayLength = (array: { length: number }, expectedLength: number): void => {
    // eslint-disable-next-line jest/prefer-to-have-length
    expect(array.length).toBe(expectedLength);
  };

  const createComponent = createComponentFactory({
    component: SyslogFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('system.advanced.config', {
          fqdn_syslog: true,
          sysloglevel: SyslogLevel.Error,
          syslog_audit: false,
          syslogservers: [
            {
              host: 'existing.server.com',
              transport: SyslogTransport.Udp,
            },
          ],
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
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
      }),
      mockProvider(DialogService),
      provideMockStore(),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
        getData: jest.fn(() => ({
          fqdn_syslog: true,
          sysloglevel: SyslogLevel.Error,
          syslog_audit: false,
          syslogservers: [
            {
              host: 'existing.server.com',
              transport: SyslogTransport.Udp,
            },
          ],
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads current settings for syslog form and shows them', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Use FQDN for Logging': true,
      'Syslog Level': 'Error',
      'Include Audit Logs': false,
      Host: 'existing.server.com',
      Transport: 'UDP',
    });
  });

  it('saves advanced config when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Use FQDN for Logging': false,
      'Syslog Level': 'Info',
      'Include Audit Logs': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [
      {
        fqdn_syslog: false,
        sysloglevel: SyslogLevel.Info,
        syslog_audit: true,
        syslogservers: [
          {
            host: 'existing.server.com',
            transport: SyslogTransport.Udp,
            tls_certificate: null,
          },
        ],
      },
    ]);
  });

  it('filters out servers without host on save', async () => {
    // Directly add an empty server to the form array
    spectator.component.syslogServersArray.push(spectator.inject(FormBuilder).group({
      host: [''],
      transport: [SyslogTransport.Udp],
      tls_certificate: [null as number | null],
    }));

    // Submit with an empty second server
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    // Should only save servers with hosts
    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [
      expect.objectContaining({
        syslogservers: [
          {
            host: 'existing.server.com',
            transport: SyslogTransport.Udp,
            tls_certificate: null,
          },
        ],
      }),
    ]);
  });

  it('handles TLS certificate as integer', async () => {
    // Add a server with TLS and certificate
    spectator.component.addServer();
    spectator.component.syslogServersArray.at(1).patchValue({
      host: 'tls.server.com',
      transport: SyslogTransport.Tls,
      tls_certificate: 2, // Already an integer from the select with converted options
    });

    // Submit the form
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    // Should keep certificate as integer
    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [
      expect.objectContaining({
        syslogservers: expect.arrayContaining([
          expect.objectContaining({
            host: 'tls.server.com',
            transport: SyslogTransport.Tls,
            tls_certificate: 2, // Should be integer
          }),
        ]),
      }),
    ]);
  });

  it('can add and remove multiple syslog servers', () => {
    // The form is already initialized in beforeEach -> createComponent
    // which calls ngOnInit automatically

    // Start with one server from mock data
    expectArrayLength(spectator.component.syslogServersArray, 1);
    expect(spectator.component.canAddServer).toBe(true);

    // Click add server button
    spectator.component.addServer();
    expectArrayLength(spectator.component.syslogServersArray, 2);

    // Fill in the second server
    spectator.component.syslogServersArray.at(1).patchValue({
      host: 'second.server.com',
      transport: SyslogTransport.Tcp,
    });

    // Try to add a third server (should not work due to limit)
    expect(spectator.component.canAddServer).toBe(false);

    // Remove first server
    spectator.component.removeServer(0);
    expectArrayLength(spectator.component.syslogServersArray, 1);
    expect(spectator.component.syslogServersArray.at(0).value.host).toBe('second.server.com');

    // Can remove the last server too
    expect(spectator.component.canRemoveServer).toBe(true);
    spectator.component.removeServer(0);
    expectArrayLength(spectator.component.syslogServersArray, 0);
    expect(spectator.component.canRemoveServer).toBe(false);
  });

  it('shows TLS certificate field only when transport is TLS', () => {
    // Add a new server
    spectator.component.addServer();
    const newServerGroup = spectator.component.syslogServersArray.at(1);

    // Initially TLS certificate should not be required
    expect(newServerGroup.controls.tls_certificate.hasError('required')).toBe(false);

    // Change transport to TLS
    newServerGroup.controls.transport.setValue(SyslogTransport.Tls);
    newServerGroup.controls.tls_certificate.updateValueAndValidity();

    // Now TLS certificate should be required
    expect(newServerGroup.controls.tls_certificate.hasError('required')).toBe(true);

    // Change back to UDP
    newServerGroup.controls.transport.setValue(SyslogTransport.Udp);
    newServerGroup.controls.tls_certificate.updateValueAndValidity();

    // TLS certificate should no longer be required
    expect(newServerGroup.controls.tls_certificate.hasError('required')).toBe(false);
  });

  it('allows configuration with no syslog servers', async () => {
    // Remove the existing server
    spectator.component.removeServer(0);
    expectArrayLength(spectator.component.syslogServersArray, 0);

    // Save with no servers
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [
      expect.objectContaining({
        syslogservers: [],
      }),
    ]);
  });

  it('enforces remove button visibility based on server count', () => {
    // With one server, can still remove it
    expect(spectator.component.canRemoveServer).toBe(true);

    // Add a second server
    spectator.component.addServer();
    expect(spectator.component.canRemoveServer).toBe(true);

    // Remove both servers
    spectator.component.removeServer(1);
    expect(spectator.component.canRemoveServer).toBe(true);

    spectator.component.removeServer(0);
    expect(spectator.component.canRemoveServer).toBe(false);
  });
});

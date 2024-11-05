import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  mockCall, mockJob, mockWebSocket,
} from 'app/core/testing/utils/mock-websocket.utils';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import {
  CertificateAcmeAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';
import { WebSocketService } from 'app/services/ws.service';

describe('CertificateAcmeAddComponent', () => {
  let spectator: Spectator<CertificateAcmeAddComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: CertificateAcmeAddComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('certificate.acme_server_choices', {
          'https://acme-staging-v02.api.letsencrypt.org/directory': "Let's Encrypt Staging Directory",
          'https://acme-v02.api.letsencrypt.org/directory': "Let's Encrypt Production Directory",
        }),
        mockCall('acme.dns.authenticator.query', [
          {
            id: 1,
            name: 'cloudflare',
          },
          {
            id: 2,
            name: 'route53',
          },
        ] as DnsAuthenticator[]),
        mockJob('certificate.create', fakeSuccessfulJob()),
        mockCall('webui.crypto.get_certificate_domain_names', ['DNS:truenas.com', 'DNS:truenas.io']),
      ]),
      mockProvider(SlideInRef),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockAuth(),
      {
        provide: SLIDE_IN_DATA,
        useValue: { id: 2 },
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads and shows domain names associated with the certificate', async () => {
    const labels = await form.getLabels();

    expect(labels).toContain('DNS:truenas.com');
    expect(labels).toContain('DNS:truenas.io');
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('webui.crypto.get_certificate_domain_names', [2]);
  });

  it('creates an ACME certificate when form is submitted', async () => {
    await form.fillForm({
      Identifier: 'new',
      'Terms of Service': true,
      'Custom ACME Server Directory URI': false,
      'ACME Server Directory URI': "Let's Encrypt Staging Directory",
      'DNS:truenas.com': 'cloudflare',
      'DNS:truenas.io': 'route53',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
      'certificate.create',
      [{
        acme_directory_uri: 'https://acme-staging-v02.api.letsencrypt.org/directory',
        create_type: CertificateCreateType.CreateAcme,
        csr_id: 2,
        dns_mapping: {
          'DNS:truenas.com': 1,
          'DNS:truenas.io': 2,
        },
        name: 'new',
        renew_days: 10,
        tos: true,
      }],
    );
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('allows custom ACME Server Directory URI', async () => {
    await form.fillForm(
      {
        Identifier: 'new',
        'Terms of Service': true,
        'Custom ACME Server Directory URI': true,
        'DNS:truenas.com': 'cloudflare',
        'DNS:truenas.io': 'route53',
        'ACME Server Directory URI': 'https://acme-staging-v02.api.letsencrypt.org/directory-custom',
      },
    );

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
      'certificate.create',
      [{
        acme_directory_uri: 'https://acme-staging-v02.api.letsencrypt.org/directory-custom',
        create_type: CertificateCreateType.CreateAcme,
        csr_id: 2,
        dns_mapping: {
          'DNS:truenas.com': 1,
          'DNS:truenas.io': 2,
        },
        name: 'new',
        renew_days: 10,
        tos: true,
      }],
    );
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });
});

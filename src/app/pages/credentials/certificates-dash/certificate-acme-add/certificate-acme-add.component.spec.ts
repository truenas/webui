import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import {
  mockCall, mockJob, mockWebsocket,
} from 'app/core/testing/utils/mock-websocket.utils';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  CertificateAcmeAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('CertificateAcmeAddComponent', () => {
  let spectator: Spectator<CertificateAcmeAddComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: CertificateAcmeAddComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
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
        mockCall('certificate.get_domain_names', ['DNS:truenas.com', 'DNS:truenas.io']),
      ]),
      mockProvider(IxSlideInRef),
      mockProvider(DialogService),
      mockProvider(MatDialog, {
        open: () => mockEntityJobComponentRef,
      }),
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
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('certificate.get_domain_names', [2]);
  });

  it('creates an ACME certificate when form is submitted', async () => {
    await form.fillForm({
      Identifier: 'new',
      'Terms of Service': true,
      'ACME Server Directory URI': "Let's Encrypt Staging Directory",
      'DNS:truenas.com': 'cloudflare',
      'DNS:truenas.io': 'route53',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
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
    expect(mockEntityJobComponentRef.componentInstance.submit).toHaveBeenCalled();
    expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import {
  mockCall, mockJob, mockApi,
} from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CertificateAcmeAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';

describe('CertificateAcmeAddComponent', () => {
  let spectator: Spectator<CertificateAcmeAddComponent>;
  let loader: HarnessLoader;

  const selectByControlName = async (name: string, label: string): Promise<void> => {
    const select = await loader.getHarness(
      TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
    );
    await select.selectOption(label);
  };

  // Domain selects use a property-bound `[formControlName]="i"` (no DOM attribute to
  // match on), so they are located positionally — they are always the last selects.
  const selectDomainAuthenticators = async (...labels: string[]): Promise<void> => {
    const selects = await loader.getAllHarnesses(TnSelectHarness);
    const domainSelects = selects.slice(-labels.length);
    for (let i = 0; i < labels.length; i++) {
      await domainSelects[i].selectOption(labels[i]);
    }
  };

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: CertificateAcmeAddComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
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
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { csr: { id: 2 } as Certificate },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads and shows domain names associated with the certificate without the DNS: prefix', () => {
    expect(spectator.fixture.nativeElement.textContent).toContain('truenas.com');
    expect(spectator.fixture.nativeElement.textContent).toContain('truenas.io');
    expect(spectator.fixture.nativeElement.textContent).not.toContain('DNS:');
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webui.crypto.get_certificate_domain_names', [2]);
  });

  it('creates an ACME certificate when form is submitted', async () => {
    await (await getInput('name')).setValue('new');
    await (await getCheckbox('tos')).check();
    await selectByControlName('acme_directory_uri', "Let's Encrypt Staging Directory");
    await selectDomainAuthenticators('cloudflare', 'route53');

    const closeSpy = jest.fn();
    spectator.component.closed.subscribe(closeSpy);
    spectator.component.submit();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'certificate.create',
      [{
        acme_directory_uri: 'https://acme-staging-v02.api.letsencrypt.org/directory',
        create_type: CertificateCreateType.CreateAcme,
        csr_id: 2,
        dns_mapping: {
          'truenas.com': 1,
          'truenas.io': 2,
        },
        name: 'new',
        renew_days: 10,
        tos: true,
      }],
    );
    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it('allows custom ACME Server Directory URI', async () => {
    await (await getInput('name')).setValue('new');
    await (await getCheckbox('tos')).check();
    await (await getCheckbox('custom_acme_directory_uri')).check();
    await (await getInput('acme_directory_uri'))
      .setValue('https://acme-staging-v02.api.letsencrypt.org/directory-custom');
    await selectDomainAuthenticators('cloudflare', 'route53');

    const closeSpy = jest.fn();
    spectator.component.closed.subscribe(closeSpy);
    spectator.component.submit();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'certificate.create',
      [{
        acme_directory_uri: 'https://acme-staging-v02.api.letsencrypt.org/directory-custom',
        create_type: CertificateCreateType.CreateAcme,
        csr_id: 2,
        dns_mapping: {
          'truenas.com': 1,
          'truenas.io': 2,
        },
        name: 'new',
        renew_days: 10,
        tos: true,
      }],
    );
    expect(closeSpy).toHaveBeenCalledWith(true);
  });
});

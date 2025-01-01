import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CertificateKeyType } from 'app/enums/certificate-key-type.enum';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { CertificateDetailsComponent } from './certificate-details.component';

describe('CertificateDetailsComponent', () => {
  let spectator: Spectator<CertificateDetailsComponent>;
  const createComponent = createComponentFactory({
    component: CertificateDetailsComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        certificate: {
          id: 1,
          name: 'ray',
          country: 'US',
          state: 'CA',
          city: 'San Francisco',
          organization: 'Death Ray Inc.',
          organizational_unit: 'High Energy Division',
          san: ['deathray.com', 'deathray.net'],
          common: 'Death Ray Inc.',
          DN: '/C=US/ST=CA...',
          email: 'energy@deathray.com',
          cert_type: 'CA',
          root_path: '/etc/certificates/CA',
          digest_algorithm: 'SHA256',
          key_length: 2048,
          key_type: CertificateKeyType.Rsa,
          until: 'Sun Apr  4 14:17:59 2032',
          issuer: 'self-signed',
          revoked: false,
          signed_certificates: 1,
          lifetime: 3650,
          certificate: '--BEGIN CERTIFICATE--',
          privatekey: '--BEGIN RSA PRIVATE KEY--',
          signedby: {
            name: 'Signed By',
          },
        } as CertificateAuthority,
      },
    });
  });

  function getDetails(): Record<string, string> {
    const itemElements = spectator.queryAll('dl > div');
    return itemElements.reduce((acc, item) => {
      const key = item.querySelector('dt')!.textContent!;
      const value = item.querySelector('dd')!.textContent!;
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  it('shows certificate details', () => {
    const details = getDetails();

    expect(details).toEqual({
      'Common:': 'Death Ray Inc.',
      'SAN:': 'deathray.com, deathray.net',
      'Distinguished Name:': '/C=US/ST=CA...',

      'Country:': 'US',
      'State:': 'CA',
      'City:': 'San Francisco',
      'Organization:': 'Death Ray Inc.',
      'Organizational Unit:': 'High Energy Division',
      'Email:': 'energy@deathray.com',

      'Type:': 'CA',
      'Path:': '/etc/certificates/CA',
      'Digest Algorithm:': 'SHA256',
      'Key Length:': '2048',
      'Key Type:': 'RSA',
      'Until:': 'Sun Apr  4 14:17:59 2032',
      'Issuer:': 'self-signed',
      'Revoked:': 'false',
      'Signed Certificates:': '1',
      'Lifetime:': '3650',
    });
  });

  it('shows Signed By field when showSignedBy is true', () => {
    spectator.setInput('showSignedBy', true);

    const details = getDetails();
    expect(details).toMatchObject({
      'Signed By:': 'Signed By',
    });
  });
});

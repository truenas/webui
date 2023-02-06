import { CertificateCreate } from 'app/interfaces/certificate.interface';

export interface CertificateStep {
  getPayload: () => Partial<CertificateCreate>;
}

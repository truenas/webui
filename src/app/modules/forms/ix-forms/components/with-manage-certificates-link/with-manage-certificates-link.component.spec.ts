import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';

describe('WithManageCertificatesLinkComponent', () => {
  let spectator: Spectator<WithManageCertificatesLinkComponent>;
  const createComponent = createComponentFactory({
    component: WithManageCertificatesLinkComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a link to manage certificates', () => {
    const link = spectator.query('a');

    expect(link).toHaveText('Manage Certificates');
    expect(link).toHaveAttribute('href', '/credentials/certificates');
  });
});

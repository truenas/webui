import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { InsecureConnectionComponent } from 'app/pages/signin/insecure-connection/insecure-connection.component';

describe('InsecureConnectionComponent', () => {
  let spectator: Spectator<InsecureConnectionComponent>;
  const createComponent = createComponentFactory({
    component: InsecureConnectionComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('show message for insecure connection', () => {
    expect(spectator.query('.message'))
      .toHaveExactTrimmedText('You are using an insecure connection. Switch to HTTPS for secure access.');
  });
});

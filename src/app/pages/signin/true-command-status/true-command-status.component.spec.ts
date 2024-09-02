import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  TrueCommandStatusComponent,
} from 'app/pages/signin/true-command-status/true-command-status.component';

describe('TrueCommandStatusComponent', () => {
  let spectator: Spectator<TrueCommandStatusComponent>;
  const createComponent = createComponentFactory({
    component: TrueCommandStatusComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('checks TrueCommand image and text', () => {
    expect(spectator.query('img')).toHaveAttribute('src', 'assets/images/truecommand/truecommand-logo-mark-full-color-rgb.svg');
    expect(spectator.query('img')).toHaveAttribute('alt', 'TrueCommand');
    expect(spectator.query('.truecommand-text')).toHaveExactText('Managed by TrueCommand');
  });
});

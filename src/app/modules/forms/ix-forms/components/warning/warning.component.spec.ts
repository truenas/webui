import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { WarningHarness } from 'app/modules/forms/ix-forms/components/warning/warning.harness';

describe('WarningComponent', () => {
  let spectator: Spectator<WarningComponent>;
  let warning: WarningHarness;
  const createComponent = createComponentFactory({
    component: WarningComponent,
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        message: '',
      },
    });
    warning = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, WarningHarness);
  });

  it('shows warning text', async () => {
    spectator.setInput('message', 'Danger ahead');

    expect(await warning.getText()).toBe('Danger ahead');
  });
});

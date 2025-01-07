import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { IxIconGroupComponent } from 'app/modules/forms/ix-forms/components/ix-icon-group/ix-icon-group.component';
import { IxIconGroupHarness } from 'app/modules/forms/ix-forms/components/ix-icon-group/ix-icon-group.harness';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';

describe('IxIconGroupComponent', () => {
  let spectator: SpectatorHost<IxIconGroupComponent>;
  let loader: HarnessLoader;
  let iconGroupHarness: IxIconGroupHarness;
  const formControl = new FormControl();
  const createHost = createHostFactory({
    component: IxIconGroupComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declareComponent: false,
  });

  beforeEach(async () => {
    spectator = createHost(
      `<ix-icon-group
        [options]="options"
        [label]="label"
        [tooltip]="tooltip"
        [required]="required"
        [formControl]="formControl"
        [showLabels]="true"
      ></ix-icon-group>`,
      {
        hostProps: {
          formControl,
          options: [
            {
              value: 'edit',
              label: 'Edit',
              icon: 'mdi-pencil',
            },
            {
              value: 'delete',
              label: 'Delete',
              icon: 'mdi-delete',
            },
          ],
          label: 'Icon group',
          tooltip: 'This is a tooltip',
          required: true,
        },
      },
    );

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    iconGroupHarness = await loader.getHarness(IxIconGroupHarness);
  });

  describe('rendering', () => {
    it('renders ix-label and passes label, hint, tooltip and required', async () => {
      const label = await loader.getHarness(IxLabelHarness.with({ label: 'Icon group' }));

      expect(label).toBeTruthy();
      expect(await label.isRequired()).toBe(true);

      const tooltip = await label.getTooltip();
      expect(tooltip).toBeTruthy();
      expect(await tooltip.getMessage()).toBe('This is a tooltip');
    });

    it('shows buttons for provided options', async () => {
      const buttons = await iconGroupHarness.getButtons();
      expect(buttons).toHaveLength(2);

      const icons = await iconGroupHarness.getIcons();
      expect(icons).toHaveLength(2);
      expect(await icons[0].getName()).toBe('mdi-pencil');
      expect(await icons[1].getName()).toBe('mdi-delete');
    });

    it('does not highlight any buttons when no value is set', async () => {
      expect(await iconGroupHarness.getValue()).toBe('');
    });

    it('highlights button with selected value', async () => {
      formControl.setValue('edit');
      expect(await iconGroupHarness.getValue()).toBe('edit');
    });
    it('shows labels when `showLabels` is set to true', async () => {
      const icons = await iconGroupHarness.getIcons();
      expect(icons).toHaveLength(2);

      const labels = spectator.queryAll('h5.title').map((el) => el.textContent);
      expect(labels[0]).toBe('Edit');
      expect(labels[1]).toBe('Delete');
    });
  });

  it('updates form control value when user presses the button', async () => {
    const buttons = await iconGroupHarness.getButtons();
    await buttons[1].click();
    expect(formControl.value).toBe('delete');
  });

  it('disables buttons when form control is disabled', async () => {
    formControl.disable();
    expect(await iconGroupHarness.isDisabled()).toBe(true);
  });

  it('adds aria-label attributes for button elements', async () => {
    const buttons = await iconGroupHarness.getButtons();
    expect(await (await buttons[0].host()).getAttribute('aria-label')).toBe('Edit');
    expect(await (await buttons[1].host()).getAttribute('aria-label')).toBe('Delete');
  });
});

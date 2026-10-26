import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { TnIconHarness, TnTooltipHarness } from '@truenas/ui-components';
import { LicensedFeatureComponent } from 'app/modules/forms/licensed-feature/licensed-feature.component';

describe('LicensedFeatureComponent', () => {
  let spectator: SpectatorHost<LicensedFeatureComponent>;
  let loader: HarnessLoader;

  const createHost = createHostFactory({
    component: LicensedFeatureComponent,
    imports: [ReactiveFormsModule],
  });

  function setup(props: Partial<{ locked: boolean; tooltip: string; lockedTooltip: string }>): void {
    spectator = createHost(
      '<ix-licensed-feature [locked]="locked" [tooltip]="tooltip" [lockedTooltip]="lockedTooltip">'
      + '<input type="checkbox" id="control">'
      + '</ix-licensed-feature>',
      {
        hostProps: {
          locked: false, tooltip: '', lockedTooltip: '', ...props,
        },
      },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  async function hoverAndGetTooltip(element: Element): Promise<string> {
    // tn-tooltip opens on a setTimeout, which zoneless harnesses do not wait for.
    jest.useFakeTimers();
    try {
      spectator.dispatchMouseEvent(element, 'mouseenter');
      await jest.advanceTimersByTimeAsync(0);
    } finally {
      jest.useRealTimers();
    }
    const tooltip = await TestbedHarnessEnvironment.documentRootLoader(spectator.fixture)
      .getHarness(TnTooltipHarness);
    return tooltip.getText();
  }

  it('projects the gated control', () => {
    setup({});
    expect(spectator.query('#control')).toExist();
  });

  describe('unlocked', () => {
    it('shows a regular help icon with the tooltip', async () => {
      setup({ tooltip: 'Feature help' });

      expect(await loader.getAllHarnesses(TnIconHarness.with({ name: 'key-variant' }))).toHaveLength(0);
      await loader.getHarness(TnIconHarness.with({ name: 'help-circle' }));
      expect(await hoverAndGetTooltip(spectator.query('button[aria-label="Feature help"]')!)).toBe('Feature help');
    });

    it('shows no icon when there is no tooltip', async () => {
      setup({ lockedTooltip: 'Requires a license.' });

      expect(await loader.getAllHarnesses(TnIconHarness)).toHaveLength(0);
    });
  });

  describe('locked', () => {
    it('replaces the help icon with a key icon carrying the same text', async () => {
      setup({ locked: true, tooltip: 'Requires an Enterprise license.' });

      expect(await loader.getAllHarnesses(TnIconHarness.with({ name: 'help-circle' }))).toHaveLength(0);
      await loader.getHarness(TnIconHarness.with({ name: 'key-variant' }));
      expect(
        await hoverAndGetTooltip(spectator.query('button[aria-label="Requires an Enterprise license."]')!),
      ).toBe('Requires an Enterprise license.');
    });

    it('explains the lock when hovering the control itself', async () => {
      setup({ locked: true, tooltip: 'Requires an Enterprise license.' });

      expect(await hoverAndGetTooltip(spectator.query('.control')!)).toBe('Requires an Enterprise license.');
    });

    it('tags the key button after the gated control', () => {
      spectator = createHost(
        '<form [formGroup]="form"><ix-licensed-feature [locked]="true" tooltip="Requires a license.">'
        + '<input type="checkbox" formControlName="rdma">'
        + '</ix-licensed-feature></form>',
        { hostProps: { form: new FormGroup({ rdma: new FormControl(false) }) } },
      );

      expect(spectator.query('button')).toHaveAttribute('data-test', 'button-licensed-feature-rdma-key');
    });

    it('prefers lockedTooltip over tooltip', async () => {
      setup({ locked: true, tooltip: 'Feature help', lockedTooltip: 'Requires an HA license.' });

      expect(spectator.query('button[aria-label="Requires an HA license."]')).toExist();
      expect(await hoverAndGetTooltip(spectator.query('.control')!)).toBe('Requires an HA license.');
    });
  });
});

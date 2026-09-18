import { ChangeDetectionStrategy, Component } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { TnFormFieldComponent, TnFormSectionComponent } from '@truenas/ui-components';
import { premiumFeatureExplanation } from 'app/directives/premium-feature/premium-badge.component';
import { PremiumFeatureDirective } from 'app/directives/premium-feature/premium-feature.directive';

/**
 * Renders the real `tn-form-section [tooltip]` and `tn-form-field [tooltip]` rather than standing
 * in for them. `keepFocusable` is keyed on the class names their triggers carry, which are the
 * library's internals: a rename in a `@truenas/ui-components` bump has to fail a test here, or the
 * help text inside every locked section silently becomes unopenable — the one thing leaving a
 * denied feature on screen is for.
 */
@Component({
  selector: 'ix-premium-host',
  template: `<tn-form-section *ixPremiumFeature="entitled; testId: 'thing'" heading="Thing" tooltip="Why the section">
    <tn-form-field label="Field" tooltip="Why the field"><input class="action" /></tn-form-field>
  </tn-form-section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PremiumFeatureDirective, TnFormFieldComponent, TnFormSectionComponent],
})
class PremiumHostComponent {
  entitled: boolean | undefined = true;
}

describe('PremiumFeatureDirective', () => {
  let spectator: Spectator<PremiumHostComponent>;

  const createComponent = createComponentFactory({
    component: PremiumHostComponent,
    imports: [TranslateModule.forRoot()],
  });

  function render(entitled: boolean | undefined): void {
    spectator = createComponent();
    spectator.component.entitled = entitled;
    spectator.detectComponentChanges();
  }

  const badge = (): HTMLElement | null => spectator.query('ix-premium-badge button');
  const action = (): HTMLElement | null => spectator.query('input.action');
  /**
   * Located by what the user reaches for — the help button the library renders for a `[tooltip]`
   * — not by the class `keepFocusable` matches on, so the test fails if the two stop agreeing.
   */
  const tooltipTriggers = (): HTMLElement[] => spectator.queryAll<HTMLElement>(
    'tn-form-section button, tn-form-field button',
  );

  it('renders the content plainly when the system is entitled', () => {
    render(true);

    expect(action()).not.toBeNull();
    expect(badge()).toBeNull();
    expect(spectator.query('.premium-feature')).toBeNull();
  });

  it('renders it plainly while the entitlement is still unknown', () => {
    // `undefined` is what the selectors report until the map loads. Treating it
    // as denied would flash a Premium tag onto every gated surface on boot.
    render(undefined);

    expect(action()).not.toBeNull();
    expect(badge()).toBeNull();
  });

  it('keeps the content on screen when denied, tagged rather than removed', () => {
    render(false);

    expect(action()).not.toBeNull();
    expect(badge()).not.toBeNull();
    expect(spectator.query('.premium-feature__content')).not.toBeNull();
  });

  it('explains what to do about it, on the badge itself', () => {
    render(false);

    // Leads with the visible word so WCAG 2.5.3 Label in Name holds, then explains: "Premium"
    // alone says nothing about why the controls beside it will not respond.
    expect(badge()).toHaveAttribute('aria-label', `Premium: ${premiumFeatureExplanation}`);
  });

  it('takes the denied content out of the tab order, leaving the badge in it', fakeAsync(() => {
    render(false);
    // `disableFocusableElements` defers a tick, so the attributes are not on
    // the elements until the timer it schedules has run.
    tick();

    expect(action()).toHaveAttribute('tabindex', '-1');
    expect(action()).toHaveAttribute('disabled');
    // The badge is outside that region on purpose: it carries the explanation,
    // and an unreachable explanation is worse than none.
    expect(badge()).not.toHaveAttribute('tabindex', '-1');
    expect(badge()).not.toHaveAttribute('disabled');
  }));

  it('leaves the denied content\'s tooltip triggers operable', fakeAsync(() => {
    render(false);
    tick();

    // The section is shown so an administrator can read what the feature does, and the library
    // opens a pinned tooltip on a click of that button alone — disabling it withholds the help.
    expect(tooltipTriggers()).not.toHaveLength(0);
    tooltipTriggers().forEach((trigger) => {
      expect(trigger).not.toHaveAttribute('disabled');
      expect(trigger).not.toHaveAttribute('tabindex', '-1');
    });
    // The control beside them is still out of reach.
    expect(action()).toHaveAttribute('disabled');
  }));
});

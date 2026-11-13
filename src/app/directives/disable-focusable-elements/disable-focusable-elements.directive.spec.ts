import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DisableFocusableElementsDirective } from './disable-focusable-elements.directive';

@Component({
  selector: 'ix-focus-host',
  template: `<div [disableFocusableElements]="disabled()"><button class="own" [disabled]="ownDisabled()">O</button>
    <a href="#">L</a><button type="button">B</button><input /><textarea></textarea><select></select>
    @if (revealed()) { <button class="late" type="button">Late</button> }<i tabindex="0"></i></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DisableFocusableElementsDirective],
})
class FocusHostComponent {
  readonly disabled = signal(true);
  readonly revealed = signal(false);
  readonly ownDisabled = signal(false);
}

describe('DisableFocusableElementsDirective', () => {
  let spectator: Spectator<FocusHostComponent>;

  const createComponent = createComponentFactory({
    component: FocusHostComponent,
  });

  /**
   * The sweep defers a tick, and the observer delivers its records as a task of its own, so both
   * need a real turn of the loop rather than a synchronous `detectChanges`.
   */
  async function settle(): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1);
    });
  }

  function render(disabled: boolean, ownDisabled = false): void {
    // Set before the first pass: the directive acts on each change, and starting from the other
    // value would leave the assertions reading whichever sweep happened to land last.
    spectator = createComponent({ detectChanges: false });
    spectator.component.disabled.set(disabled);
    spectator.component.ownDisabled.set(ownDisabled);
    spectator.detectChanges();
  }

  const focusable = (): HTMLElement[] => spectator.queryAll<HTMLElement>(
    'a, button, input, textarea, select, i[tabindex]',
  );

  it('takes every focusable element out of the tab order when disabled', async () => {
    render(true);
    await settle();

    const elements = focusable();
    expect(elements).not.toHaveLength(0);
    elements.forEach((element) => {
      expect(element).toHaveAttribute('tabindex', '-1');
      expect(element).toHaveAttribute('disabled');
    });
  });

  it('leaves them in it when enabled', async () => {
    render(false);
    await settle();

    const elements = focusable();
    expect(elements).not.toHaveLength(0);
    elements.forEach((element) => {
      expect(element).toHaveAttribute('tabindex', '0');
      expect(element).not.toHaveAttribute('disabled');
    });
  });

  it('disables content the region renders after the first sweep', async () => {
    render(true);
    await settle();

    spectator.component.revealed.set(true);
    spectator.detectChanges();
    await settle();

    expect(spectator.query('.late')).toHaveAttribute('tabindex', '-1');
    expect(spectator.query('.late')).toHaveAttribute('disabled');
  });

  it('keeps a control disabled when its own binding enables it after the first sweep', async () => {
    // The order a role-locked button sees when its data loads after the role check: disabled by
    // its own binding during the sweep, which skips it, then enabled by that binding.
    render(true, true);
    await settle();

    spectator.component.ownDisabled.set(false);
    spectator.detectChanges();
    await settle();

    expect(spectator.query('.own')).toHaveAttribute('disabled');
    expect(spectator.query('.own')).toHaveAttribute('tabindex', '-1');
  });

  it('leaves a control its own binding enables alone once the region is enabled', async () => {
    render(false, true);
    await settle();

    spectator.component.ownDisabled.set(false);
    spectator.detectChanges();
    await settle();

    expect(spectator.query('.own')).not.toHaveAttribute('disabled');
  });

  it('leaves later content alone once the region is enabled again', async () => {
    render(true);
    await settle();

    spectator.component.disabled.set(false);
    spectator.detectChanges();
    await settle();

    spectator.component.revealed.set(true);
    spectator.detectChanges();
    await settle();

    // Not swept back to `disabled`: an enabled region has no business writing to whatever
    // appears inside it, which may be disabled for reasons of its own.
    expect(spectator.query('.late')).not.toBeNull();
    expect(spectator.query('.late')).not.toHaveAttribute('disabled');
  });
});

import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { TnTooltipDirective } from '@truenas/ui-components';
import { VmwareStatusCellComponent, VmwareSnapshotStatus, VmwareState } from './vmware-status-cell.component';

describe('VmwareStatusCellComponent', () => {
  let spectator: Spectator<VmwareStatusCellComponent>;

  const createComponent = createComponentFactory({
    component: VmwareStatusCellComponent,
  });

  function setState(state: VmwareState): void {
    spectator.setInput('state', state);
    spectator.detectChanges();
  }

  function pill(): HTMLElement {
    return spectator.query('.state-button')!;
  }

  function screenReaderOnlyText(): string {
    return spectator.query('.sr-only')?.textContent?.trim() ?? '';
  }

  function tooltip(): string {
    // Read the tooltip through the directive rather than the component's own
    // protected signal — the directive is what the user actually sees.
    return String(spectator.query(TnTooltipDirective)!.message());
  }

  beforeEach(() => {
    spectator = createComponent({
      props: {
        state: {
          state: VmwareSnapshotStatus.Success,
          datetime: { $time: 1702123456000 },
        },
      },
    });
  });

  describe('pill rendering', () => {
    it('renders a non-interactive status pill', () => {
      expect(pill().tagName.toLowerCase()).toBe('span');
      expect(pill()).toHaveClass('state-button');
    });

    // The state word carries the status for anyone who can't use the colour, so it has to
    // stay real text in the accessibility tree rather than being replaced by an aria-label.
    it('states the status as text, with no aria-label overriding it', () => {
      expect(pill()).toHaveText('Success');
      expect(pill()).not.toHaveAttribute('aria-label');
      expect(pill()).not.toHaveAttribute('role');
      expect(screenReaderOnlyText()).toBe('');
    });

    it('appends the explanation for states that carry it only in the (unreachable) tooltip', () => {
      setState({ state: VmwareSnapshotStatus.Error, error: 'Connection timeout' });

      expect(pill()).toHaveText('Error , Connection timeout');
      expect(screenReaderOnlyText()).toBe(', Connection timeout');
    });

    it('appends nothing for states whose tooltip only repeats the visible word', () => {
      setState({ state: VmwareSnapshotStatus.Pending });

      expect(screenReaderOnlyText()).toBe('');
    });
  });

  describe('tooltip', () => {
    it('should show "Success" tooltip for SUCCESS state', () => {
      setState({ state: VmwareSnapshotStatus.Success });

      expect(tooltip()).toBe('Success');
    });

    it('should show "Pending" tooltip for PENDING state', () => {
      setState({ state: VmwareSnapshotStatus.Pending });

      expect(tooltip()).toBe('Pending');
    });

    it('should show error message tooltip for ERROR state when error is provided', () => {
      setState({ state: VmwareSnapshotStatus.Error, error: 'Connection timeout' });

      expect(tooltip()).toBe('Connection timeout');
    });

    it('should show "Error" tooltip for ERROR state when no error message is provided', () => {
      setState({ state: VmwareSnapshotStatus.Error });

      expect(tooltip()).toBe('Error');
    });

    it('should show "Blocked due to outbound network restrictions" tooltip for BLOCKED state', () => {
      setState({ state: VmwareSnapshotStatus.Blocked });

      expect(tooltip()).toBe('Blocked due to outbound network restrictions');
    });
  });

  describe('state classes and text', () => {
    it('should apply state-green class and Success text for SUCCESS state', () => {
      setState({ state: VmwareSnapshotStatus.Success });

      expect(pill()).toHaveClass('state-green');
      expect(pill()).toHaveText('Success');
    });

    it('should apply state-orange class and Pending text for PENDING state', () => {
      setState({ state: VmwareSnapshotStatus.Pending });

      expect(pill()).toHaveClass('state-orange');
      expect(pill()).toHaveText('Pending');
    });

    it('should apply state-red class and Error text for ERROR state', () => {
      setState({ state: VmwareSnapshotStatus.Error, error: 'Some error' });

      expect(pill()).toHaveClass('state-red');
      expect(pill()).toHaveText('Error');
      expect(pill()).toHaveText('Some error');
    });

    it('should apply state-yellow class and Blocked text for BLOCKED state', () => {
      setState({ state: VmwareSnapshotStatus.Blocked });

      expect(pill()).toHaveClass('state-yellow');
      expect(pill()).toHaveText('Blocked');
      expect(pill()).toHaveText('Blocked due to outbound network restrictions');
    });
  });

  // The pill text and tooltip were `| translate` bindings before the migration; as
  // `translate.instant()` inside a computed they have to keep following a language change.
  describe('language change', () => {
    it('re-translates the pill text and tooltip', () => {
      setState({ state: VmwareSnapshotStatus.Blocked });
      expect(pill()).toHaveText('Blocked');

      const translate = spectator.inject(TranslateService);
      translate.setTranslation('fr', {
        BLOCKED: 'Bloqué',
        'Blocked due to outbound network restrictions': 'Restrictions réseau',
      });
      translate.use('fr');
      spectator.detectChanges();

      expect(pill()).toHaveText('Bloqué');
      expect(tooltip()).toBe('Restrictions réseau');
    });
  });
});

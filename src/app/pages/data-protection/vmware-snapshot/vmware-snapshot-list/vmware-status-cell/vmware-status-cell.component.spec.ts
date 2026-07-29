import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
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

  function tooltip(): string {
    // Read the tooltip through the directive rather than the component's own
    // protected signal — the directive is what the user actually sees.
    return String(spectator.query(TnTooltipDirective)!.message);
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

    it('folds the state into the accessible name so status is not colour-only', () => {
      spectator.setInput('rowLabel', 'esxi-host-1 VMware Snapshot');
      spectator.detectChanges();

      // Same wording as the visible pill text, so the accessible name and the label match.
      expect(pill()).toHaveText('Success');
      expect(pill()).toHaveAttribute('aria-label', 'esxi-host-1 VMware Snapshot, Success');
    });

    it('appends the explanation to the accessible name for states that only tooltip it', () => {
      spectator.setInput('rowLabel', 'esxi-host-1 VMware Snapshot');
      setState({ state: VmwareSnapshotStatus.Error, error: 'Connection timeout' });

      expect(pill()).toHaveAttribute(
        'aria-label',
        'esxi-host-1 VMware Snapshot, Error, Connection timeout',
      );
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
    });

    it('should apply state-yellow class and Blocked text for BLOCKED state', () => {
      setState({ state: VmwareSnapshotStatus.Blocked });

      expect(pill()).toHaveClass('state-yellow');
      expect(pill()).toHaveText('Blocked');
    });
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { VmwareStatusCellComponent, VmwareSnapshotStatus } from './vmware-status-cell.component';

describe('VmwareStatusCellComponent', () => {
  let spectator: Spectator<VmwareStatusCellComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: VmwareStatusCellComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        state: {
          state: VmwareSnapshotStatus.Success,
          datetime: { $time: 1702123456000 },
        },
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('button rendering', () => {
    it('should render a disabled button', async () => {
      const button = await loader.getHarness(MatButtonHarness);
      expect(await button.isDisabled()).toBe(true);
    });

    it('should display the state text', async () => {
      const button = await loader.getHarness(MatButtonHarness);
      expect(await button.getText()).toBe('SUCCESS');
    });

    it('should have state-button class', async () => {
      const button = await loader.getHarness(MatButtonHarness);
      const host = await button.host();
      expect(await host.hasClass('state-button')).toBe(true);
    });
  });

  describe('tooltip', () => {
    it('should show "Success" tooltip for SUCCESS state', () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Success,
        datetime: { $time: 1702123456000 },
      });

      expect(spectator.component.tooltip).toBe('Success');
    });

    it('should show "Pending" tooltip for PENDING state', () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Pending,
        datetime: { $time: 1702123456000 },
      });

      expect(spectator.component.tooltip).toBe('Pending');
    });

    it('should show error message tooltip for ERROR state when error is provided', () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Error,
        error: 'Connection timeout',
        datetime: { $time: 1702123456000 },
      });

      expect(spectator.component.tooltip).toBe('Connection timeout');
    });

    it('should show "Error" tooltip for ERROR state when no error message is provided', () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Error,
        datetime: { $time: 1702123456000 },
      });

      expect(spectator.component.tooltip).toBe('Error');
    });

    it('should show "Blocked due to outbound network restrictions" tooltip for BLOCKED state', () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Blocked,
        datetime: { $time: 1702123456000 },
      });

      expect(spectator.component.tooltip).toBe('Blocked due to outbound network restrictions');
    });
  });

  describe('button theme classes', () => {
    it('should apply fn-theme-green class for SUCCESS state', async () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Success,
        datetime: { $time: 1702123456000 },
      });

      const button = await loader.getHarness(MatButtonHarness);
      const host = await button.host();
      expect(await host.hasClass('fn-theme-green')).toBe(true);
    });

    it('should apply fn-theme-orange class for PENDING state', async () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Pending,
        datetime: { $time: 1702123456000 },
      });

      const button = await loader.getHarness(MatButtonHarness);
      const host = await button.host();
      expect(await host.hasClass('fn-theme-orange')).toBe(true);
    });

    it('should apply fn-theme-red class for ERROR state', async () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Error,
        error: 'Some error',
        datetime: { $time: 1702123456000 },
      });

      const button = await loader.getHarness(MatButtonHarness);
      const host = await button.host();
      expect(await host.hasClass('fn-theme-red')).toBe(true);
    });

    it('should apply fn-theme-yellow class for BLOCKED state', async () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Blocked,
        datetime: { $time: 1702123456000 },
      });

      const button = await loader.getHarness(MatButtonHarness);
      const host = await button.host();
      expect(await host.hasClass('fn-theme-yellow')).toBe(true);
    });
  });

  describe('state display', () => {
    it('should display SUCCESS state', async () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Success,
        datetime: { $time: 1702123456000 },
      });

      const button = await loader.getHarness(MatButtonHarness);
      expect(await button.getText()).toBe('SUCCESS');
    });

    it('should display PENDING state', async () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Pending,
        datetime: { $time: 1702123456000 },
      });

      const button = await loader.getHarness(MatButtonHarness);
      expect(await button.getText()).toBe('PENDING');
    });

    it('should display ERROR state', async () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Error,
        error: 'Some error',
        datetime: { $time: 1702123456000 },
      });

      const button = await loader.getHarness(MatButtonHarness);
      expect(await button.getText()).toBe('ERROR');
    });

    it('should display BLOCKED state', async () => {
      spectator.setInput('state', {
        state: VmwareSnapshotStatus.Blocked,
        datetime: { $time: 1702123456000 },
      });

      const button = await loader.getHarness(MatButtonHarness);
      expect(await button.getText()).toBe('BLOCKED');
    });
  });
});

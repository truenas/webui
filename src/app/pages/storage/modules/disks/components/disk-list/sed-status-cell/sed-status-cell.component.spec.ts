import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SedStatusCellComponent } from './sed-status-cell.component';

describe('SedStatusCellComponent', () => {
  let spectator: Spectator<SedStatusCellComponent<Disk>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SedStatusCellComponent<Disk>,
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.component.propertyName = 'sed_status';
    spectator.component.uniqueRowTag = (row) => row.name;
  });

  it('shows "Unsupported" for disks without SED support', async () => {
    spectator.component.setRow({ name: 'sda', sed: false } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Unsupported');
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-close' }));
    expect(icon).toBeTruthy();
  });

  it('shows "Unsupported" for disks with null sed property', async () => {
    spectator.component.setRow({ name: 'sda', sed: null } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Unsupported');
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-close' }));
    expect(icon).toBeTruthy();
  });

  it('shows "Unsupported" for disks with undefined sed property', async () => {
    spectator.component.setRow({ name: 'sda' } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Unsupported');
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-close' }));
    expect(icon).toBeTruthy();
  });

  it('shows "Unlocked" for unlocked SED disks', async () => {
    spectator.component.setRow({ name: 'sda', sed: true, sed_status: SedStatus.Unlocked } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Unlocked');
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-lock-open-variant' }));
    expect(icon).toBeTruthy();
  });

  it('shows "Locked" for locked SED disks', async () => {
    spectator.component.setRow({ name: 'sda', sed: true, sed_status: SedStatus.Locked } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Locked');
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-lock' }));
    expect(icon).toBeTruthy();
  });

  it('shows "Uninitialized" for uninitialized SED disks', async () => {
    spectator.component.setRow({ name: 'sda', sed: true, sed_status: SedStatus.Uninitialized } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Uninitialized');
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-checkbox-blank-circle-outline' }));
    expect(icon).toBeTruthy();
  });

  it('shows "Failed" for failed SED disks', async () => {
    spectator.component.setRow({ name: 'sda', sed: true, sed_status: SedStatus.Failed } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Failed');
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-alert-circle' }));
    expect(icon).toBeTruthy();
  });

  it('shows "Unknown" for unknown SED status', async () => {
    spectator.component.setRow({ name: 'sda', sed: true, sed_status: 'SOMETHING_ELSE' as SedStatus } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Unknown');
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-help-circle' }));
    expect(icon).toBeTruthy();
  });
});

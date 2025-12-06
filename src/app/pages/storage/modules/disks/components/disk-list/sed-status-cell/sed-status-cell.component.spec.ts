import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { SedStatusCellComponent } from './sed-status-cell.component';

describe('SedStatusCellComponent', () => {
  let spectator: Spectator<SedStatusCellComponent<Disk>>;

  const createComponent = createComponentFactory({
    component: SedStatusCellComponent<Disk>,
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'sed_status';
    spectator.component.uniqueRowTag = (row) => row.name;
  });

  it('shows "Unsupported" for disks without SED support', () => {
    spectator.component.setRow({ name: 'sda', sed: false } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Unsupported');
  });

  it('shows "Unsupported" for disks with null sed property', () => {
    spectator.component.setRow({ name: 'sda', sed: null } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Unsupported');
  });

  it('shows "Unsupported" for disks with undefined sed property', () => {
    spectator.component.setRow({ name: 'sda' } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Unsupported');
  });

  it('shows "Unlocked" for unlocked SED disks', () => {
    spectator.component.setRow({ name: 'sda', sed: true, sed_status: SedStatus.Unlocked } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Unlocked');
  });

  it('shows "Locked" for locked SED disks', () => {
    spectator.component.setRow({ name: 'sda', sed: true, sed_status: SedStatus.Locked } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Locked');
  });

  it('shows "Uninitialized" for uninitialized SED disks', () => {
    spectator.component.setRow({ name: 'sda', sed: true, sed_status: SedStatus.Uninitialized } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Uninitialized');
  });

  it('shows "Failed" for failed SED disks', () => {
    spectator.component.setRow({ name: 'sda', sed: true, sed_status: SedStatus.Failed } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Failed');
  });

  it('shows "Unknown" for unknown SED status', () => {
    spectator.component.setRow({ name: 'sda', sed: true, sed_status: 'SOMETHING_ELSE' as SedStatus } as Disk);
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('Unknown');
  });
});

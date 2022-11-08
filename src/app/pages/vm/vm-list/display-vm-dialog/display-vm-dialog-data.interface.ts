import { VmDisplayDevice } from 'app/interfaces/vm-device.interface';
import { VirtualMachineRow } from 'app/pages/vm/vm-list/virtual-machine-row.interface';

export interface DisplayVmDialogData {
  vm: VirtualMachineRow;
  displayDevices: VmDisplayDevice[];
}

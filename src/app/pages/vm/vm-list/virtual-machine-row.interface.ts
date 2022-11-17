import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';

export interface VirtualMachineRow extends VirtualMachine {
  vm_type: string;
  port: string | boolean | number;
  state: string;
  com_port: string;
  shutdownTimeoutString: string;
  memoryString: string;
}

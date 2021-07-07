import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';

export interface VirtualMachineRow extends Omit<VirtualMachine, 'shutdown_timeout' | 'memory'> {
  vm_type: string;
  port: string | boolean | number;
  state: string;
  com_port: string;
  shutdown_timeout: string;
  memory: string;
}

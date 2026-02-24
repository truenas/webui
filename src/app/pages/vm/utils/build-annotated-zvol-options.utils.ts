import { Choices } from 'app/interfaces/choices.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDiskDevice } from 'app/interfaces/vm-device.interface';

export interface AnnotatedZvolOption {
  label: string;
  value: string;
  usedByCurrentVm: boolean;
  otherVmNames: string[];
}

export function buildAnnotatedZvolOptions(
  choices: Choices,
  allDiskDevices: VmDiskDevice[],
  allVms: Pick<VirtualMachine, 'id' | 'name'>[],
  currentVmId: number | null,
  currentDevicePath: string | null,
): AnnotatedZvolOption[] {
  const vmNameMap = new Map<number, string>(
    allVms.map((vm) => [vm.id, vm.name]),
  );

  const zvolVmsMap = new Map<string, { vmId: number; vmName: string }[]>();
  for (const device of allDiskDevices) {
    const path = device.attributes.path;
    const vmId = device.vm;
    const vmName = vmNameMap.get(vmId) ?? `VM ${vmId}`;

    if (!zvolVmsMap.has(path)) {
      zvolVmsMap.set(path, []);
    }
    zvolVmsMap.get(path).push({ vmId, vmName });
  }

  return Object.entries(choices).map(([value, label]) => {
    const usages = zvolVmsMap.get(value) ?? [];

    const filteredUsages = currentDevicePath === value
      ? usages.filter((usage) => usage.vmId !== currentVmId)
      : usages;

    const usedByCurrentVm = currentVmId !== null
      && filteredUsages.some((usage) => usage.vmId === currentVmId);

    const otherVmNames = filteredUsages
      .filter((usage) => usage.vmId !== currentVmId)
      .map((usage) => usage.vmName);

    return {
      label, value, usedByCurrentVm, otherVmNames,
    };
  });
}

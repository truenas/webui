import { VmDeviceType, VmDiskMode } from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDiskDevice } from 'app/interfaces/vm-device.interface';
import { buildAnnotatedZvolOptions } from 'app/pages/vm/utils/build-annotated-zvol-options.utils';

describe('buildAnnotatedZvolOptions', () => {
  const choices = {
    '/dev/zvol/pool/zvol-a': 'pool/zvol-a',
    '/dev/zvol/pool/zvol-b': 'pool/zvol-b',
    '/dev/zvol/pool/zvol-c': 'pool/zvol-c',
  };

  const vms = [
    { id: 1, name: 'VM-A' },
    { id: 2, name: 'VM-B' },
    { id: 3, name: 'VM-C' },
  ] as VirtualMachine[];

  function makeDiskDevice(vmId: number, path: string): VmDiskDevice {
    return {
      vm: vmId,
      attributes: { path, dtype: VmDeviceType.Disk, type: VmDiskMode.Ahci },
    } as VmDiskDevice;
  }

  it('returns normal options for unattached zvols', () => {
    const result = buildAnnotatedZvolOptions(choices, [], vms, 1, null);

    expect(result).toEqual([
      {
        label: 'pool/zvol-a', value: '/dev/zvol/pool/zvol-a', usedByCurrentVm: false, otherVmNames: [],
      },
      {
        label: 'pool/zvol-b', value: '/dev/zvol/pool/zvol-b', usedByCurrentVm: false, otherVmNames: [],
      },
      {
        label: 'pool/zvol-c', value: '/dev/zvol/pool/zvol-c', usedByCurrentVm: false, otherVmNames: [],
      },
    ]);
  });

  it('does not flag zvol matching currentDevicePath (editing that device)', () => {
    const devices = [makeDiskDevice(1, '/dev/zvol/pool/zvol-a')];

    const result = buildAnnotatedZvolOptions(choices, devices, vms, 1, '/dev/zvol/pool/zvol-a');

    const zvolA = result.find((opt) => opt.value === '/dev/zvol/pool/zvol-a');
    expect(zvolA.usedByCurrentVm).toBe(false);
    expect(zvolA.otherVmNames).toEqual([]);
  });

  it('flags zvol used by same VM on a different device', () => {
    const devices = [makeDiskDevice(1, '/dev/zvol/pool/zvol-b')];

    const result = buildAnnotatedZvolOptions(choices, devices, vms, 1, '/dev/zvol/pool/zvol-a');

    const zvolB = result.find((opt) => opt.value === '/dev/zvol/pool/zvol-b');
    expect(zvolB.usedByCurrentVm).toBe(true);
    expect(zvolB.otherVmNames).toEqual([]);
  });

  it('lists other VM name when zvol is used by a different VM', () => {
    const devices = [makeDiskDevice(2, '/dev/zvol/pool/zvol-a')];

    const result = buildAnnotatedZvolOptions(choices, devices, vms, 1, null);

    const zvolA = result.find((opt) => opt.value === '/dev/zvol/pool/zvol-a');
    expect(zvolA.usedByCurrentVm).toBe(false);
    expect(zvolA.otherVmNames).toEqual(['VM-B']);
  });

  it('lists multiple other VM names when zvol is shared across VMs', () => {
    const devices = [
      makeDiskDevice(2, '/dev/zvol/pool/zvol-a'),
      makeDiskDevice(3, '/dev/zvol/pool/zvol-a'),
    ];

    const result = buildAnnotatedZvolOptions(choices, devices, vms, 1, null);

    const zvolA = result.find((opt) => opt.value === '/dev/zvol/pool/zvol-a');
    expect(zvolA.otherVmNames).toEqual(['VM-B', 'VM-C']);
  });

  it('flags both usedByCurrentVm and otherVmNames when zvol is used by current and other VMs', () => {
    const devices = [
      makeDiskDevice(1, '/dev/zvol/pool/zvol-a'),
      makeDiskDevice(2, '/dev/zvol/pool/zvol-a'),
    ];

    const result = buildAnnotatedZvolOptions(choices, devices, vms, 1, null);

    const zvolA = result.find((opt) => opt.value === '/dev/zvol/pool/zvol-a');
    expect(zvolA.usedByCurrentVm).toBe(true);
    expect(zvolA.otherVmNames).toEqual(['VM-B']);
  });

  it('returns empty array for empty choices', () => {
    const result = buildAnnotatedZvolOptions({}, [], vms, 1, null);
    expect(result).toEqual([]);
  });

  it('handles null currentVmId (wizard mode with no VM yet)', () => {
    const devices = [makeDiskDevice(1, '/dev/zvol/pool/zvol-a')];

    const result = buildAnnotatedZvolOptions(choices, devices, vms, null, null);

    const zvolA = result.find((opt) => opt.value === '/dev/zvol/pool/zvol-a');
    expect(zvolA.usedByCurrentVm).toBe(false);
    expect(zvolA.otherVmNames).toEqual(['VM-A']);
  });
});

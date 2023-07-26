import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { VmCpuMode } from 'app/enums/vm.enum';
import globalHelptext from 'app/helptext/global-helptext';

export default {
  os_tooltip: T('Choose the VM operating system type.'),
  name_tooltip: T('Enter an alphanumeric name for the virtual machine.'),
  password_tooltip: T('Enter a password for the virtual machine.'),
  description_tooltip: T('Description (optional).'),
  time_tooltip: T('VM system time. Default is <i>Local</i>.'),
  bootloader_tooltip: T('Select <i>UEFI</i> for newer operating systems or\
 <i>UEFI-CSM</i> (Compatibility Support Mode) for\
 older operating systems that only support BIOS\
 booting. <i>Grub</i> is not recommended but can be\
 used when the other options do not work.'),
  autostart_tooltip: T('Set to start this VM when the system boots.'),
  enable_display_tooltip: T('Enable a Display (Virtual Network Computing) remote\
 connection. Requires <i>UEFI</i> booting.'),
  display_bind_tooltip: T('Display network interface IP address. The primary\
 interface IP address is the default. A different interface IP\
 address can be chosen.'),
  vcpus_warning: T('The product of vCPUs, cores and threads must not exceed {maxVcpus} on this system.'),
  vcpus_tooltip: T('Number of virtual CPUs to allocate to the virtual\
 machine. The VM operating system\
 might have operational or licensing\
 restrictions on the number of CPUs.'),

  cores: {
    tooltip: T('Specify the number of cores per virtual CPU socket.'),
  },

  threads: {
    tooltip: T('Specify the number of threads per core.'),
  },

  cpuset: {
    tooltip: T('Specify the logical cores that VM is allowed to use. \
Better cache locality can be achieved by setting CPU set base on CPU topology. \
E.g. to assign cores: 0,1,2,5,9,10,11 you can write: 1-2,5,9-11'),
  },

  nodeset: {
    // TODO: If still used, replace back with variable reference
    tooltip: T('Node set allows setting NUMA nodes for multi NUMA processors when CPU set was defined. \
Better memory locality can be achieved by setting node set based on assigned CPU set. \
E.g. if cpus 0,1 belong to NUMA node 0 then setting nodeset to 0 will improve memory locality'),
  },

  pin_vcpus: {
    tooltip: T('When number of vcpus is equal to number of cpus in CPU set vcpus can be automatically pinned into CPU set. \
Pinning is done by mapping each vcpu into single cpu number in following the order in CPU set. \
This will improve CPU cache locality and can reduce possible stutter in GPU passthrough VMs.'),
  },

  ensure_display_device: {
    tooltip: T('When checked it will ensure that the guest always has access to a video device. For headless installations like ubuntu server this is required for the guest to operate properly. However for cases where consumer would like to use GPU passthrough and does not want a display device added should uncheck this.'),
  },

  shutdown_timeout: {
    tooltip: T('The time in seconds the system waits for the VM to cleanly shut down. \
 During system shutdown, the system initiates poweroff for the VM after the shutdown \
 timeout has expired.'),
  },

  cpu_mode: {
    options: [
      { label: 'Custom', value: VmCpuMode.Custom },
      { label: 'Host Model', value: VmCpuMode.HostModel },
      { label: 'Host Passthrough', value: VmCpuMode.HostPassthrough },
    ],
  },

  cpu_model: {
    placeholder: T('CPU Model'),
  },

  hyperv_enlightenments_tooltip: T('KVM implements Hyper-V Enlightenments \
  for Windows guests. These features make Windows think they\'re \
  running on top of a Hyper-V compatible hypervisor and use Hyper-V specific features. \
  In some cases enabling these Enlightenments might improve usability and performance on the guest.'),

  global_label: globalHelptext.human_readable.suggestion_label,
  memory_tooltip: T('Allocate RAM for the VM. Minimum value is 256 MiB.'),
  global_tooltip: globalHelptext.human_readable.suggestion_tooltip,
  memory_size_err: T('Allocate at least 256 MiB.'),
  memory_warning: T('Caution: Allocating too much memory can slow the \
 system or prevent VMs from running.'),
  min_memory_tooltip: T('When not specified, guest system is given fixed amount of memory specified above.\n'
    + 'When minimum memory is specified, guest system is given memory within range between minimum and fixed as needed.'),
  vm_mem_title: T('Available Memory:'),

  disk_radio_tooltip: T('Select <i>Create new disk image</i> to create a new\
 zvol on an existing dataset. This is used as a\
 virtual hard drive for the VM. Select <i>Use\
 existing disk image</i> to use an existing zvol or\
 file for the VM.'),

  volsize_tooltip: T('Allocate space for the new zvol.'),
  volsize_tooltip_B: T('MiB. Units \
 smaller than MiB are not allowed.'),

  datastore_tooltip: T('Select a dataset for the new zvol.'),

  hdd_type_tooltip: T('Select desired disk type.'),

  hdd_path_tooltip: T('Browse to the desired zvol on the disk.'),

  NIC_type_tooltip: T('<i>Intel e82545 (e1000)</i> emulates the same\
 Intel Ethernet card. This provides compatibility\
 with most operating systems. <i>VirtIO</i>\
 provides better performance when the operating\
 system installed in the VM supports VirtIO\
 paravirtualized network drivers.'),

  NIC_mac_tooltip: T('Enter the desired address into the field to\
 override the randomized MAC address.'),
  NIC_mac_value: '00:a0:98:FF:FF:FF',

  nic_attach_tooltip: T('Select the physical interface to associate with\
 the VM.'),

  iso_path_tooltip: T('Browse to the operating system installer image file.'),

  upload_iso_checkbox_tooltip: T('Set to display image upload options.'),

  upload_iso_path_tooltip: T('Choose a location to store the installer image file.'),

  upload_iso_tooltip: T('Browse to the installer image file and click <b>Upload</b>.'),
};

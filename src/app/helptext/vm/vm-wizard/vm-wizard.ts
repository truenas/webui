import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { VmCpuMode } from 'app/enums/vm.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { regexValidator } from 'app/modules/entity/entity-form/validators/regex-validation';

export default {
  formTitle: T('Create Virtual Machine'),

  os_label: T('Operating System'),
  os_placeholder: T('Guest Operating System'),
  os_tooltip: T('Choose the VM operating system type.'),
  os_options: [
    { label: 'Windows', value: 'Windows' },
    { label: 'Linux', value: 'Linux' },
    { label: 'FreeBSD', value: 'FreeBSD' },
  ],
  os_validation: [Validators.required],

  name_placeholder: T('Name'),
  name_tooltip: T('Enter an alphanumeric name for the virtual machine.'),

  description_placeholder: T('Description'),
  description_tooltip: T('Description (optional).'),

  time_placeholder: T('System Clock'),
  time_tooltip: T('VM system time. Default is <i>Local</i>.'),
  time_local_text: T('Local'),
  time_utc_text: T('UTC'),

  bootloader_placeholder: T('Boot Method'),
  bootloader_tooltip: T('Select <i>UEFI</i> for newer operating systems or\
 <i>UEFI-CSM</i> (Compatibility Support Mode) for\
 older operating systems that only support BIOS\
 booting. <i>Grub</i> is not recommended but can be\
 used when the other options do not work.'),

  autostart_placeholder: T('Start on Boot'),
  autostart_tooltip: T('Set to start this VM when the system boots.'),

  enable_display_placeholder: T('Enable Display'),
  enable_display_tooltip: T('Enable a Display (Virtual Network Computing) remote\
 connection. Requires <i>UEFI</i> booting.'),

  display_bind_placeholder: T('Bind'),
  display_bind_tooltip: T('Display network interface IP address. The primary\
 interface IP address is the default. A different interface IP\
 address can be chosen.'),

  vcpus_label: T('CPU and Memory'),
  vcpus_warning: T('The product of vCPUs, cores and threads must not exceed {maxVCPUs} on this system.'),
  vcpus_placeholder: T('Virtual CPUs'),
  vcpus_tooltip: T('Number of virtual CPUs to allocate to the virtual\
 machine. The VM operating system\
 might have operational or licensing\
 restrictions on the number of CPUs.'),

  cores: {
    placeholder: T('Cores'),
    tooltip: T('Specify the number of cores per virtual CPU socket.'),
  },

  threads: {
    placeholder: T('Threads'),
    tooltip: T('Specify the number of threads per core.'),
  },

  cpuset: {
    placeholder: T('Optional: CPU Set (Examples: 0-3,8-11)'),
    tooltip: T('Specify the logical cores that VM is allowed to use. \
Better cache locality can be achieved by setting CPU set base on CPU topology. \
E.g. to assign cores: 0,1,2,5,9,10,11 you can write: 1-2,5,9-11'),
  },

  nodeset: {
    placeholder: T('Optional: NUMA nodeset (Example: 0-1)'),
    tooltip: T('Node set allows setting NUMA nodes for multi NUMA processors when CPU set was defined. \
Better memory locality can be achieved by setting node set based on assigned CPU set. \
E.g. if cpus 0,1 belong to NUMA node 0 then setting nodeset to 0 will improve memory locality'),
  },

  pin_vcpus: {
    placeholder: T('Pin vcpus'),
    tooltip: T('When number of vcpus is equal to number of cpus in CPU set vcpus can be automatically pinned into CPU set. \
Pinning is done by mapping each vcpu into single cpu number in following the order in CPU set. \
This will improve CPU cache locality and can reduce possible stutter in GPU passthrough VMs.'),
  },

  shutdown_timeout: {
    placeholder: T('Shutdown Timeout'),
    tooltip: T('The time in seconds the system waits for the VM to cleanly shut down. \
 During system shutdown, the system initiates poweroff for the VM after the shutdown \
 timeout has expired.'),
    validation: [Validators.min(0)],
  },

  cpu_mode: {
    placeholder: T('CPU Mode'),
    tooltip: T(''),
    options: [
      { label: 'Custom', value: VmCpuMode.Custom },
      { label: 'Host Model', value: VmCpuMode.HostModel },
      { label: 'Host Passthrough', value: VmCpuMode.HostPassthrough },
    ],
  },

  cpu_model: {
    placeholder: T('CPU Model'),
    tooltip: T(''),
  },

  hyperv_enlightenments_placeholder: T('Enable Hyper-V Enlightenments'),
  hyperv_enlightenments_tooltip: T('KVM implements Hyper-V Enlightenments \
  for Windows guests. These features make Windows think they\'re \
  running on top of a Hyper-V compatible hypervisor and use Hyper-V specific features. \
  In some cases enabling these Enlightenments might improve usability and performance on the guest.'),

  memory_placeholder: T('Memory Size'),
  global_label: globalHelptext.human_readable.suggestion_label,
  memory_validation: [Validators.required],
  memory_tooltip: T('Allocate RAM for the VM. Minimum value is 256 MiB.'),
  global_tooltip: globalHelptext.human_readable.suggestion_tooltip,
  memory_unit: T('bytes.'),
  memory_size_err: T('Allocate at least 256 MiB.'),
  memory_warning: T('Caution: Allocating too much memory can slow the \
 system or prevent VMs from running.'),
  vm_mem_title: T('Available Memory:'),

  disks_label: T('Disks'),
  disk_radio_tooltip: T('Select <i>Create new disk image</i> to create a new\
 zvol on an existing dataset. This is used as a\
 virtual hard drive for the VM. Select <i>Use\
 existing disk image</i> to use an existing zvol or\
 file for the VM.'),
  disk_radio_options_new_label: T('Create new disk image'),
  disk_radio_options_existing_label: T('Use existing disk image'),

  volsize_placeholder: T('Size'),
  volsize_tooltip: T('Allocate space for the new zvol.'),
  volsize_tooltip_B: T('MiB. Units \
 smaller than MiB are not allowed.'),
  volsize_validation: [Validators.required],
  volsize_min_err: T('Minimum size is 1 MiB'),

  datastore_tooltip: T('Select a dataset for the new zvol.'),
  datastore_placeholder: T('Zvol Location'),

  hdd_type_placeholder: T('Select Disk Type'),
  hdd_type_tooltip: T('Select desired disk type.'),
  hdd_type_options: [
    { label: 'AHCI', value: 'AHCI' },
    { label: 'VirtIO', value: 'VIRTIO' },
  ],
  hdd_type_value: 'AHCI',

  hdd_path_placeholder: T('Select Existing zvol'),
  hdd_path_tooltip: T('Browse to the desired zvol on the disk.'),

  NIC_label: T('Network Interface'),
  NIC_type_placeholder: T('Adapter Type'),
  NIC_type_tooltip: T('<i>Intel e82545 (e1000)</i> emulates the same\
 Intel Ethernet card. This provides compatibility\
 with most operating systems. <i>VirtIO</i>\
 provides better performance when the operating\
 system installed in the VM supports VirtIO\
 paravirtualized network drivers.'),

  NIC_type_validation: [Validators.required],

  NIC_mac_placeholder: T('Mac Address'),
  NIC_mac_tooltip: T('Enter the desired address into the field to\
 override the randomized MAC address.'),
  NIC_mac_value: '00:a0:98:FF:FF:FF',
  NIC_mac_validation: [regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i)],

  nic_attach_placeholder: T('Attach NIC'),
  nic_attach_tooltip: T('Select the physical interface to associate with\
 the VM.'),
  nic_attach_validation: [Validators.required],

  trust_guest_rx_filters_placeholder: T('Trust Guest Filters'),

  media_label: T('Installation Media'),
  iso_path_placeholder: T('Optional: Choose installation media image'),
  iso_path_tooltip: T('Browse to the operating system installer image file.'),

  upload_iso_checkbox_placeholder: T('Upload an installer image file'),
  upload_iso_checkbox_tooltip: T('Set to display image upload options.'),

  upload_iso_path_placeholder: T('ISO save location'),
  upload_iso_path_tooltip: T('Choose a location to store the installer image file.'),

  upload_iso_placeholder: T('ISO upload location'),
  upload_iso_tooltip: T('Browse to the installer image file and click <b>Upload</b>.'),
  upload_iso_validation: [],

  vm_settings_title: T('General VM Settings'),
  vm_cpu_mem_title: T('CPUs and Memory'),
};

import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const containersHelptext = {
  cpuHint: T('Leave empty to allow all host CPUs to be used.'),
  nameHint: T('Name cannot be changed after instance is created'),
  memoryHint: T('Leave empty to not limit instance memory.'),
  vncHint: T('VNC connection is currently insecure. Secure the connection in other ways.'),

  name_placeholder: T('Name'),

  instance_type_placeholder: T('Virtualization Method'),
  instance_type_tooltip: T('<b>Why choose Container?</b><br />\
Containers, powered by LXC, offer lightweight, efficient virtualization by sharing the host OS kernel, \
providing faster startup times and reduced resource usage compared to VMs. \
<br /><br />\
Ideal for scalable applications.<br /><br />\
<b>Why choose VM?</b><br />\
Virtual Machines (VMs), powered by QEMU, offer full OS isolation, kernel independence, and can run diverse OS types. \
<br /><br />\
Ideal for legacy applications, full-featured desktops, or software with strict OS dependencies.'),

  cpu_memory_tooltip: T('<b>CPU Configuration</b><br />Enter the number of cores. Use multiple values\
 or ranges to set the CPU topology.<br />Example: 1-2, 5, 9-11.'),

  cpu_placeholder: T('CPU Configuration'),
  cpu_tooltip: T('Enter number of cores or multiple values or ranges to set CPU topology. Example: 1-2,5,9-11'),

  memory_placeholder: T('Memory Size'),
  memory_tooltip: T('Specify RAM allocation for the container. You can use units such as GB, MB.'),

  env_placeholder: T('Environment Variables'),
  env_name_placeholder: T('Name'),
  env_value_placeholder: T('Value'),

  disks_placeholder: T('Disks'),
  disks_src_placeholder: T('Source'),
  disks_dst_placeholder: T('Destination'),
  disks_dst_tooltip: T('Specify the container filesystem path where the disk will be mounted.'),

  proxies_placeholder: T('Proxies'),

  host_protocol_placeholder: T('Host Protocol'),
  host_port_placeholder: T('Host Port'),
  host_port_tooltip: T('Specify the host port to be mapped to the container\'s port.'),

  io_bus_tooltip: T('Choose the disk I/O bus type that best suits your system’s needs:\
 <br /><br /> • NVMe – Ideal for high-performance storage with faster read and write speeds.\
 <br /><br /> • Virtio-BLK – Efficient for virtualized environments, offering direct block device access with lower overhead.\
 <br /><br /> • Virtio-SCSI – Flexible and scalable, supporting advanced features like hot-swapping and multiple devices.'),

  instance_protocol_placeholder: T('Instance Protocol'),
  instance_protocol_tooltip: T('Select the protocol for the instance\'s network connection.'),
  instance_port_placeholder: T('Instance Port'),

  network_tooltip: T('Use the default network settings to connect the default bridge to the host.</br>\
<br />\
<b>Bridged NIC</b> uses an existing bridge on the host and creates a virtual device pair to connect the host bridge to the instance.<br />\
<br />\
<b>Macvlan NIC</b> sets up a new network device based on an existing network device, but using a different MAC address.'),

  network_use_default_placeholder: T('Use default network settings'),
  network_bridged_nics_placeholder: T('Bridged NICs'),
  network_mac_vlan_nics_placeholder: T('Macvlan NICs'),

  usb_devices_placeholder: T('USB Devices'),

  enable_vnc_placeholder: T('Enable VNC'),
  enable_vnc_tooltip: T('Check to allow remote desktop access via VNC.'),

  add_tpm_placeholder: T('Add Trusted Platform Module'),
  add_tpm_tooltip: T('Virtual device that provides hardware-based security functions like encryption key management.'),

  secure_boot_tooltip: T('Secure Boot ensures that only trusted, signed software runs during a system’s startup process. May be incompatible with some images.'),
  secure_boot_on_required_tooltip: T('Secure Boot is required for the VM image you selected'),
  secure_boot_off_required_tooltip: T('Secure Boot is required to be off for the VM image you selected'),

  idMapHint: T('By default, accounts inside instances are mapped to a special private range of UIDs and GIDs to perform security isolation for the containers.\
  This range starts at 2147000001.\
  <br>\
  You can use this dialog to control mapping manually.'),

  mapDirectlyTooltip: T('UID/GID from the host is directly mapped to the same id in a container. This means that GID 3000 will appear as GID 3000 in the container.'),
};

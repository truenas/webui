import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const instancesHelptext = {
  cpuHint: T('Leave empty to allow all host CPUs to be used.'),
  nameHint: T('Name cannot be changed after instance is created'),
  memoryHint: T('Leave empty to not limit instance memory.'),
  vncHint: T('VNC connection is currently insecure. Secure the connection in other ways.'),

  namePlaceholderLabel: T('Name'),

  virtualizationMethodLabel: T('Virtualization Method'),
  virtualizationMethodTooltip: T('<b>Why choose Container?</b><br />\
Containers, powered by LXC, offer lightweight, efficient virtualization by sharing the host OS kernel, \
providing faster startup times and reduced resource usage compared to VMs. \
<br /><br />\
Ideal for scalable applications.<br /><br />\
<b>Why choose VM?</b><br />\
Virtual Machines (VMs), powered by QEMU, offer full OS isolation, kernel independence, and can run diverse OS types. \
<br /><br />\
Ideal for legacy applications, full-featured desktops, or software with strict OS dependencies.'),

  cpuMemoryTooltip: T('<b>CPU Configuration</b><br />Enter the number of cores. Alternatively, use multiple values\
 or ranges to set the CPU topology.<br />Example: 1-2, 5, 9-11.'),

  cpuLabel: T('CPU Configuration'),
  cpuTooltip: T('Enter number of cores or multiple values or ranges to set CPU topology. Example: 1-2,5,9-11'),

  memoryLabel: T('Memory Size'),
  memoryTooltip: T('Specify RAM allocation for the container. You can use units such as GB, MB.'),

  envLabel: T('Environment Variables'),
  envNameLabel: T('Name'),
  envValueLabel: T('Value'),

  disksLabel: T('Disks'),
  disksSourceLabel: T('Source'),
  disksDestinationLabel: T('Destination'),
  disksDestinationTooltip: T('Specify the container filesystem path where the disk will be mounted.'),

  proxiesLabel: T('Proxies'),

  hostProtocolLabel: T('Host Protocol'),
  hostPortLabel: T('Host Port'),
  hostPortTooltip: T('Specify the host port to be mapped to the container\'s port.'),

  ioBusTooltip: T('Choose the disk I/O bus type that best suits your system’s needs:\
 <br /><br /> • NVMe – Ideal for high-performance storage with faster read and write speeds.\
 <br /><br /> • Virtio-BLK – Efficient for virtualized environments, offering direct block device access with lower overhead.\
 <br /><br /> • Virtio-SCSI – Flexible and scalable, supporting advanced features like hot-swapping and multiple devices.'),

  bootFromTooltip: T('Select the disk to boot the instance from.'),

  instanceProtocolLabel: T('Instance Protocol'),
  instanceProtocolTooltip: T('Select the protocol for the instance\'s network connection.'),
  instancePortLabel: T('Instance Port'),

  networkTooltip: T('Use the default network settings to connect the default bridge to the host.</br>\
<br />\
<b>Bridged NIC</b> uses an existing bridge on the host and creates a virtual device pair to connect the host bridge to the instance.<br />\
<br />\
<b>Macvlan NIC</b> sets up a new network device based on an existing network device, but using a different MAC address.'),

  networkUseDefaultLabel: T('Use default network settings'),
  networkBridgedNicsLabel: T('Bridged NICs'),
  networkMacVlanNicsLabel: T('Macvlan NICs'),

  usbDevicesLabel: T('USB Devices'),

  enableVncLabel: T('Enable VNC'),
  enableVncTooltip: T('Check to allow remote desktop access via VNC.'),

  addTpmLabel: T('Add Trusted Platform Module'),
  addTpmTooltip: T('Virtual device that provides hardware-based security functions like encryption key management.'),

  secureBootTooltip: T('Secure Boot ensures that only trusted, signed software runs during a system’s startup process. May be incompatible with some images.'),
  secureBootOnRequiredTooltip: T('Secure Boot is required for the VM image you selected'),
  secureBootOffRequiredTooltip: T('Secure Boot is required to be off for the VM image you selected'),

  idMapHint: T('By default, accounts inside instances are mapped to a special private range of UIDs and GIDs to perform security isolation for the containers.\
  This range starts at 2147000001.\
  <br>\
  You can use this dialog to control mapping manually.'),

  mapDirectlyTooltip: T('UID/GID from the host is directly mapped to the same id in a container. This means that GID 3000 will appear as GID 3000 in the container.'),

  importZvol: {
    cloneTooltip: T('Clone and promote a temporary snapshot of the zvol into a custom storage volume.'),
    moveTooltip: T('Renames the ZFS dataset to a path in the `ix-virt` dataset in which the zvol is located.'),
    description: T('Importing a zvol as Instances volume allows its lifecycle to be managed, including backups, restores, and snapshots. This allows portability between systems using standard tools.'),
  },

  osImage: {
    tooltip: T('Optionally specify the operating system for VM-based instances.\
 Common options are Windows, Linux, FreeBSD but you can also enter a custom value.\
 Leaving this field empty is allowed. \n \n When creating a Windows VM, make sure to set the this field to Windows.\
 Doing so will tell us to expect Windows to be running inside of the virtual machine\
 and to tweak behavior accordingly.'),
  },
};

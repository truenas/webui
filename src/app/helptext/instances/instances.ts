import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const instancesHelptext = {
  cpuHint: T('Leave empty to allow all host CPUs to be used.'),
  nameHint: T('Name cannot be changed after container is created'),
  memoryHint: T('Leave empty to not limit container memory.'),
  vncHint: T('VNC connection is currently insecure. Secure the connection in other ways.'),

  namePlaceholderLabel: T('Name'),

  virtualizationMethodLabel: T('Virtualization Method'),

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

  deviceTypes: {
    diskTooltip: T('<b>Disk Device</b><br />A zvol from the host presented as a block device inside the container (e.g., /dev/sda).\
<br />Ideal for creating virtual disks with ZFS features like snapshots and compression.'),
    rawTooltip: T('<b>Raw Device</b><br />A raw file from the host presented as a block device inside the container (e.g., /dev/sdb).\
<br />Useful for mounting existing disk images or ISO files.'),
    filesystemTooltip: T('<b>Filesystem Device</b><br />A bind mount that makes a host directory available inside the container at a specific mount point.\
<br />Use this for sharing data between host and container or persisting container data.'),
  },

  deviceBadgeTooltips: {
    disk: T('Zvol block device'),
    raw: T('Raw file block device'),
    filesystem: T('Filesystem bind mount'),
    usb: T('USB device'),
    nic: T('Network interface'),
    unknown: T('Unknown device'),
  },

  deviceDescriptions: {
    defaultMacAddress: T('Default Mac Address'),
    unknown: T('Unknown'),
    unknownPath: T('Unknown path'),
    unknownSource: T('Unknown source'),
    unknownTarget: T('Unknown target'),
  },

  diskFormOptions: {
    virtio: T('VirtIO'),
    ahci: T('AHCI'),
    native: T('Native'),
    threads: T('Threads'),
    ioUring: T('IO_URING'),
  },

  proxiesLabel: T('Proxies'),

  hostProtocolLabel: T('Host Protocol'),
  hostPortLabel: T('Host Port'),
  hostPortTooltip: T('Specify the host port to be mapped to the container\'s port.'),

  ioBusTooltip: T('Choose the disk I/O bus type that best suits your system’s needs:\
 <br /><br /> • NVMe – Ideal for high-performance storage with faster read and write speeds.\
 <br /><br /> • Virtio-BLK – Efficient for virtualized environments, offering direct block device access with lower overhead.\
 <br /><br /> • Virtio-SCSI – Flexible and scalable, supporting advanced features like hot-swapping and multiple devices.'),

  bootFromTooltip: T('Select the disk to boot the container from.'),

  instanceProtocolLabel: T('Container Protocol'),
  instanceProtocolTooltip: T('Select the protocol for the container\'s network connection.'),
  instancePortLabel: T('Container Port'),

  networkTooltip: T('Use the default network settings to connect the default bridge to the host.</br>\
<br />\
<b>Bridged NIC</b> uses an existing bridge on the host and creates a virtual device pair to connect the host bridge to the container.<br />\
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

  idMapHint: T('By default, accounts inside containers are mapped to a special private range of UIDs and GIDs to perform security isolation for the containers.\
  This range starts at 2147000001.\
  <br>\
  You can use this dialog to control mapping manually.'),

  mapDirectlyTooltip: T('UID/GID from the host is directly mapped to the same id in a container. This means that GID 3000 will appear as GID 3000 in the container.'),

  importZvol: {
    cloneTooltip: T('Clone and promote a temporary snapshot of the zvol into a custom storage volume.'),
    moveTooltip: T('Renames the ZFS dataset to a path in the `ix-virt` dataset in which the zvol is located.'),
    description: T('Importing a zvol as Containers volume allows its lifecycle to be managed, including backups, restores, and snapshots. This allows portability between systems using standard tools.'),
  },

  osImage: {
    tooltip: T('Optionally specify the operating system for VM-based containers.\
 Common options are Windows, Linux, FreeBSD but you can also enter a custom value.\
 Leaving this field empty is allowed. \n \n When creating a Windows VM, make sure to set the this field to Windows.\
 Doing so will tell us to expect Windows to be running inside of the virtual machine\
 and to tweak behavior accordingly.'),
  },

  validators: {
    blockDeviceName: T('Invalid block device name. Use format like: sda, vda, or nvme0n1'),
    containerPathMustStartWithSlash: T('Container path must start with /'),
    containerPathCannotEndWithSlash: T('Container path cannot end with /'),
    containerPathCannotContainDoubleSlash: T('Container path cannot contain //'),
    containerPathInvalidCharacters: T('Invalid characters in container path'),
    targetMustNotContainBraces: T('Target must not contain braces'),
    diskPathMustStartWithDevZvol: T('Disk path must start with "/dev/zvol/"'),
    rawFilePathMustStartWithMnt: T('Raw file path must reside within a pool mount point (start with /mnt/)'),
    poolPathMustStartWithMnt: T('Path must reside within a pool mount point (start with /mnt/)'),
    sourceMustNotContainBraces: T('Source must not contain braces'),
  },
};

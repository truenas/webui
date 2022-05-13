import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  cd_path_tooltip: T('Browse to a CD-ROM file present on the system storage.'),
  zvol_path_tooltip: T('Define the path to an existing zvol for VM use.'),

  mode_tooltip: T('<i>AHCI</i> emulates an AHCI hard disk for better\
 software compatibility. <i>VirtIO</i> uses\
 paravirtualized drivers and can provide better\
 performance, but requires the operating system\
 installed in the VM to support VirtIO disk devices.'),

  sectorsize_tooltip: T('Select a sector size in bytes. <i>Default</i> leaves the\
 sector size unset and uses the ZFS volume values. Setting a sector size\
 changes both the logical and physical sector size.'),

  adapter_type_tooltip: T('Emulating an <i>Intel e82545 (e1000)</i> Ethernet card\
 provides compatibility with most operating systems. Change to\
 <i>VirtIO</i> to provide better performance on systems\
 with VirtIO paravirtualized network driver support.'),

  mac_tooltip: T('By default, the VM receives an auto-generated random\
 MAC address. Enter a custom address into the field to\
 override the default. Click <b>Generate MAC Address</b>\
 to add a new randomized address into this field.'),

  nic_attach_tooltip: T('Select a physical interface to associate with the VM.'),

  raw_file_path_tooltip: T('Browse to a storage location and add the name of the\
 new raw file on the end of the path.'),

  mode_type_tooltip: T('<i>AHCI</i> emulates an AHCI hard disk for best\
 software compatibility. <i>VirtIO</i> uses\
 paravirtualized drivers and can provide better\
 performance, but requires the operating system\
 installed in the VM to support VirtIO disk devices.'),

  raw_size_tooltip: T('Define the size of the raw file in GiB.'),

  pptdev_tooltip: T('Specify the PCI device to pass thru (bus#/slot#/fcn#).'),

  rootpwd_tooltip: T('Enter a password for the <i>rancher</i> user. This\
 is used to log in to the VM from the serial shell.'),

  port_tooltip: T('Can be set to <i>0</i>, left empty for TrueNAS to\
 assign a port when the VM is started, or set to a\
 fixed, preferred port number.'),

  wait_placeholder: T('Delay VM Boot Until VNC Connects'),
  wait_tooltip: T('Wait to start VM until VNC client connects.'),

  resolution_tooltip: T('Select a screen resolution to use for VNC sessions.'),
  bind_tooltip: T('Select an IP address to use for VNC sessions.'),
  password_tooltip: T('Enter a VNC password to automatically pass to the\
 VNC session. Passwords cannot be longer than 8\
 characters.'),
  web_tooltip: T('Set to enable connecting to the VNC web interface.'),
};

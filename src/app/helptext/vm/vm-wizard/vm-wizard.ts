import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { regexValidator } from '../../../pages/common/entity/entity-form/validators/regex-validation';

export default {
wizard_type_label: T('Select VM wizard type'),
wizard_type_placeholder: T('Virtual Machine (VM) Wizard type.'),
wizard_type_tooltip: T('Select the Virtual Machine (VM) Wizard type.'),
wizard_type_options: [
  {label: 'Virtual Machine (VM)', value: 'vm'},
],
wizard_type_validation : [ Validators.required ],
wizard_type_value: 'vm',

os_label: T('Operating System'),
os_placeholder: T('Guest Operating System'),
os_tooltip: T('Choose the VM operating system type.'),
os_options: [
  {label: 'Windows', value: 'Windows'},
  {label: 'Linux', value: 'Linux'},
  {label: 'FreeBSD', value: 'FreeBSD'},
],
os_validation : [ Validators.required ],

name_placeholder : T('Name'),
name_tooltip : T('Enter an alphanumeric name for the virtual machine.'),
name_validation : [ Validators.required ],

description_placeholder : T('Description'),
description_tooltip : T('Description (optional).'),

time_placeholder : T('System clock'),
time_tooltip: T('VM system time. Default is <i>Local</i>.'),
time_local_text: T('Local'),

bootloader_placeholder : T('Boot Method'),
bootloader_tooltip : T('Select <i>UEFI</i> for newer operating systems or\
 <i>UEFI-CSM</i> (Compatibility Support Mode) for\
 older operating systems that only support BIOS\
 booting. <i>Grub</i> is not recommended but can be\
 used when the other options do not work.'),

autostart_placeholder : T('Start on Boot'),
autostart_tooltip : T('Set to start this VM when the system boots.'),

enable_vnc_placeholder : T('Enable VNC'),
enable_vnc_tooltip : T('Enable a VNC (Virtual Network Computing) remote\
 connection. Requires <i>UEFI</i> booting.'),

vnc_bind_placeholder: T("Bind"),
vnc_bind_tooltip: T("VNC network interface IP address. The primary\
 interface IP address is the default. A different interface IP\
 address can be chosen."),

vcpus_label: T('CPU and Memory'),
vcpus_placeholder: T('Virtual CPUs'),
vcpus_validation : [ Validators.required, Validators.min(1), Validators.max(16) ],
vcpus_tooltip: T('Number of virtual CPUs to allocate to the virtual\
 machine. The maximum is 16, or fewer if the host\
 CPU limits the maximum. The VM operating system\
 might also have operational or licensing\
 restrictions on the number of CPUs.'),

memory_limitation: T('Available memory'),
memory_placeholder: T('Memory Size (MiB)'),
memory_validation : [ Validators.required, Validators.min(128)],
memory_tooltip: T('Allocate a number of megabytes of RAM for the VM.'),

disks_label: T('Hard Disks'),
disk_radio_tooltip: T('Select <i>Create new disk image</i> to create a new\
 zvol on an existing dataset. This is used as a\
 virtual hard drive for the VM. Select <i>Use\
 existing disk image</i> to use an existing zvol or\
 file for the VM.'),
disk_radio_options:[{label:T("Create new disk image"), value: true},
{label:T("Use existing disk image"), value: false}],

volsize_placeholder : T('Size (GiB)'),
volsize_tooltip: T('Allocate a number of gigabytes of space for the\
 new zvol.'),
volsize_validation: [Validators.required, Validators.min(1)],

datastore_tooltip: T('Select a dataset for the new zvol.'),
datastore_placeholder: T('Zvol Dataset Location'),

hdd_type_placeholder: T('Select Disk Type'),
hdd_type_tooltip: T('Select desired disk type.'),
hdd_type_options : [
  {label : 'AHCI', value : 'AHCI'},
  {label : 'VirtIO', value : 'VIRTIO'},
],
hdd_type_value: 'AHCI',

hdd_path_placeholder: T('Select Existing zvol'),
hdd_path_tooltip: T('Browse to the desired zvol on the disk.'),

NIC_label: T('Network Interface'),
NIC_type_placeholder : T('Adapter Type'),
NIC_type_tooltip : T('<i>Intel e82545 (e1000)</i> emulates the same\
 Intel Ethernet card. This provides compatibility\
 with most operating systems. <i>VirtIO</i>\
 provides better performance when the operating\
 system installed in the VM supports VirtIO\
 paravirtualized network drivers.'),

NIC_type_validation : [ Validators.required ],

NIC_mac_placeholder : T('Mac Address'),
NIC_mac_tooltip : T('Enter the desired address into the field to\
 override the randomized MAC address.'),
NIC_mac_value : '00:a0:98:FF:FF:FF',
NIC_mac_validation : [ regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i) ],

nic_attach_placeholder : T('Attach NIC'),
nic_attach_tooltip : T('Select the physical interface to associate with\
 the VM.'),
nic_attach_validation : [ Validators.required ],

media_label: T('Installation Media'),
iso_path_placeholder : T('Optional: Choose installation media image'),
iso_path_tooltip: T('Browse to the operating system installer image file.'),
iso_path_validation : [ Validators.required ],

upload_iso_checkbox_placeholder : T('Upload an installer image file'),
upload_iso_checkbox_tooltip: T('Set to display image upload options.'),

upload_iso_path_placeholder : 'ISO save location',
upload_iso_path_tooltip: T('Choose a location to store the installer image file.'),
upload_iso_path_validation: [],

upload_iso_placeholder : 'ISO upload location',
upload_iso_tooltip: 'Browse to the installer image file and click <b>Upload</b>.',
upload_iso_validation : [  ],
}

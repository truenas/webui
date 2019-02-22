import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { regexValidator } from '../../../pages/common/entity/entity-form/validators/regex-validation';
import globalHelptext from '../../global-helptext';

export default {
wizard_type_label: T('Select VM wizard type'),
wizard_type_placeholder: T('Virtual Machine (VM) Wizard type.'),
wizard_type_tooltip: T('Select the Virtual Machine (VM) Wizard type.'),
wizard_type_options: [
    {label: 'Virtual Machine (VM)', value: 'vm'},
    {label: globalHelptext.dockerhost, value: 'docker'},
],
wizard_type_validation : [ Validators.required ],
wizard_type_value: 'docker',

docker_vm_label: globalHelptext.dockerhost + " Details",
docker_vm_placeholder :  T ('Name'),
docker_vm_tooltip : T("Enter a name for this " + globalHelptext.dockerhost + "."),
docker_vm_validation : [ Validators.required ],

autostart_placeholder : T ('Start on Boot'),
autostart_tooltip : T('Set to start this VM when the system boots.'),
autostart_value: true,

vcpus_label:  T ('CPU and Memory configuration.'),
vcpus_placeholder:  T('Virtual CPUs'),
vcpus_tooltip : T('Enter a number of virtual CPUs to allocate to the\
 VM. The maximum is 16 unless the host CPU also\
 limits the maximum. The VM operating system can\
 also have operational or licensing restrictions on\
 the number of CPUs.'),
vcpus_validation : [ Validators.required, Validators.min(1), Validators.max(16) ],

memory_placeholder: T('Memory Size (MiB)'),
memory_tooltip: T("Allocate a number of megabytes of RAM to the " + globalHelptext.dockerhost + "."),
memory_value: 2048,
memory_validation : [ Validators.required, Validators.min(2048)],

NIC_type_label: 'Network Interface',
NIC_type_placeholder : T('Adapter Type'),
NIC_type_tooltip : T('<i>Intel e82545 (e1000)</i> emulates an\
 Intel Ethernet card. This provides compatibility\
 with most operating systems. <i>VirtIO</i>\
 provides better performance when the operating\
 system installed in the VM supports VirtIO\
 paravirtualized network drivers.'),
NIC_type_validation : [ Validators.required ],

NIC_mac_placeholder : T('MAC Address'),
NIC_mac_tooltip : T('A randomized MAC address is normally assigned.\
 Enter a value here to set a specific MAC address.'),
NIC_mac_value : '00:a0:98:FF:FF:FF',
NIC_mac_validation : [ regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i) ],

nic_attach_placeholder : T('Attach NIC'),
nic_attach_tooltip : T('Select the physical network interface to associate\
with the virtual machine.'),
nic_attach_validation : [ Validators.required ],

files_label: 'Storage Files',
raw_filename_placeholder : T('Raw filename'),
raw_filename_tooltip: T('Name the new raw file.'),
raw_filename_validation : [ Validators.required ],

raw_filename_password_placeholder : T('Raw filename password'),
raw_filename_password_tooltip: T('Raw filename password. The default is <i>docker</i>.'),
raw_filename_password_validation : [ Validators.required ],

raw_filesize_placeholder : T('Raw file size (GiB)'),
raw_filesize_tooltip: T('Set the size of the new\
 raw file.'),
raw_filesize_validation: [Validators.required, Validators.min(20)],

raw_file_directory_placeholder: T('Raw file location'),
raw_file_directory_tooltip: T('Browse to an existing directory to store the new\
 raw file.'),
raw_file_directory_validation : [ Validators.required ],

sectorsize_placeholder : 'Disk sector size',
sectorsize_tooltip : 'Select a sector size in bytes. <i>Default</i> leaves the\
 sector size unset.',
sectorsize_options: [
    { label: 'Default', value:0 },
    { label: '512', value:512 },
    { label: '4096', value:4096 },
]
}

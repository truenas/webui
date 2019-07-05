import { T } from '../../../translate-marker';
import {Validators} from '@angular/forms';

export default {
serial_shell_tooltip : '<b>Ctrl+C</b> kills a foreground process.<br>\
 Many utilities are built-in:<br><b>Iperf</b>,\
 <b>Netperf</b>, <b>IOzone</b>, <b>arcsat</b>,\
 <b>tw_cli</b>, <br><b>MegaCli</b>,\
 <b>freenas-debug</b>, <b>tmux</b>,\
 <b>Dmidecode</b>.<br> Refer to the <a\
 href="--docurl--/cli.html"\
 target="_blank">Command Line Utilities</a>\
 chapter in the <b>User Guide</b> for usage\
 information and examples.',

// VM card edit
config_name_placeholder: T('Name'),
config_name_tooltip: T('Enter a name for the VM.'),
config_name_validation:[Validators.required],

config_description_placeholder : T('Description (max. 25 characters)'),
config_description_tooltip: T('Describe the VM or its purpose.'),
config_description_validation: Validators.maxLength(25),

autostart_placeholder: T('Start on Boot'),
autostart_tooltip: T('Set to start the VM automatically on boot.'),

bootloader_placeholder: T('Boot Loader Type'),
bootloader_tooltip: T('Select <b>UEFI</b> for newer operating systems, or\
 <b>UEFI-CSM</b> (Compatibility Support Mode) for\
 older operating systems that only support BIOS\
 booting.'),
bootloader_validation:[Validators.required],

vcpus_placeholder : T('Virtual CPUs'),
vcpus_tooltip: T('Enter a number of virtual CPUs to allocate to the\
 VM. The maximum is 16 unless the host CPU also\
 limits the maximum. The VM operating system can\
 also have operational or licensing restrictions on\
 the number of CPUs.'),
vcpus_validation:[Validators.required, Validators.min(1), Validators.max(16)],

memory_placeholder: T('Memory Size (MiB)'),
memory_tooltip: T('Allocate a number of megabytes of RAM to the VM.'),
memory_validation:[Validators.required]

}
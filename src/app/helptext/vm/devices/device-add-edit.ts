import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { regexValidator } from '../../../pages/common/entity/entity-form/validators/regex-validation';

export default {
dtype_placeholder: 'Type',
dtype_value: 'CDROM',
dtype_validation: [Validators.required],

cd_path_placeholder : T('CD-ROM Path'),
cd_path_tooltip : T('Browse to a CD-ROM file present on the system storage.'),
cd_path_validation : [ Validators.required ],

order_placeholder : T('Device Order'),
order_tooltip : '',

zvol_path_placeholder : 'Zvol',
zvol_path_tooltip : 'Browse to an existing <a\
 href="%%docurl%%/storage.html%%webversion%%#adding-zvols"\
 target="_blank">Zvol</a>.',
zvol_path_validation : [Validators.required],
options:[],

mode_placeholder : T('Mode'),
mode_tooltip : T('<i>AHCI</i> emulates an AHCI hard disk for better\
 software compatibility. <i>VirtIO</i> uses\
 paravirtualized drivers and can provide better\
 performance, but requires the operating system\
 installed in the VM to support VirtIO disk devices.'),
mode_options : [
  {label : 'AHCI', value : 'AHCI'},
  {label : 'VirtIO', value : 'VIRTIO'},
],

sectorsize_placeholder : T('Disk sector size'),
sectorsize_tooltip : T('Select a sector size in bytes. <i>Default</i> leaves the\
 leaves the sector size unset.'),
sectorsize_options: [
  { label: 'Default', value:0 },
  { label: '512', value:512 },
  { label: '4096', value:4096 },
],

adapter_type_placeholder: T('Adapter Type:'),
adapter_type_tooltip: T('Emulating an <i>Intel e82545 (e1000)</i> Ethernet card\
 provides compatibility with most operating systems. Change to\
 <i>VirtIO</i> to provide better performance on systems\
 with VirtIO paravirtualized network driver support.'),
adapter_type_validation: [Validators.required],

mac_placeholder: T('MAC Address'),
mac_tooltip: T('By default, the VM receives an auto-generated random\
 MAC address. Enter a custom address into the field to\
 override the default. Click <b>Generate MAC Address</b>\
 to add a new randomized address into this field.'),
mac_value: '00:a0:98:FF:FF:FF',
mac_validation: [regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i)],

nic_attach_placeholder: T('Nic to attach:'),
nic_attach_tooltip: T('Select a physical interface to associate with the VM.'),
nic_attach_validation: [Validators.required],

raw_file_path_placeholder : T('Raw File'),
raw_file_path_tooltip : T('Browse to a storage location and add the name of the\
 new raw file on the end of the path.'),
raw_file_path_validation: [Validators.required],

mode_type_placeholder : T('Mode'),
mode_type_tooltip : T('<i>AHCI</i> emulates an AHCI hard disk for best\
 software compatibility. <i>VirtIO</i> uses\
 paravirtualized drivers and can provide better\
 performance, but requires the operating system\
 installed in the VM to support VirtIO disk devices.'),


raw_size_placeholder : T('Raw filesize'),
raw_size_tooltip : T('Define the size of the raw file in GiB.'),

rootpwd_placeholder : T('password'),
rootpwd_tooltip : T('Enter a password for the <i>rancher</i> user. This\
 is used to log in to the VM from the serial shell.'),

boot_placeholder : T('boot'),
boot_tooltip : '',

vnc_port_placeholder : T('Port'),
vnc_port_tooltip : T('Can be set to <i>0</i>, left empty for FreeNAS to\
 assign a port when the VM is started, or set to a\
 fixed, preferred port number.'),

wait_placeholder : T('Delay VM Boot until VNC Connects'),
wait_tooltip : T('Wait to start VM until VNC client connects.'),

vnc_resolution_placeholder : T('Resolution'),
vnc_resolution_tooltip : T('Select a screen resolution to use for VNC sessions.'),
vnc_resolution_options : [
  {label : '1920x1080', value : "1920x1080"},
  {label : '1400x1050', value : "1400x1050"},
  {label : '1280x1024', value : "1280x1024"},
  {label : '1280x960', value : "1280x960"},
  {label : '1024x768', value : '1024x768'},
  {label : '800x600', value : '800x600'},
  {label : '640x480', value : '640x480'},
],

vnc_bind_placeholder : T('Bind'),
vnc_bind_tooltip : T('Select an IP address to use for VNC sessions.'),

vnc_password_placeholder : T('Password'),
vnc_password_tooltip : T('Enter a VNC password to automatically pass to the\
 VNC session. Passwords cannot be longer than 8\
 characters.'),
vnc_password_validation: [Validators.maxLength(8)],

vnc_web_placeholder : T('Web Interface'),
vnc_web_tooltip : T('Set to enable connecting to the VNC web interface.'),
}

import { T } from '../../../translate-marker';
import {Validators} from '@angular/forms';

export default {
    ini_type_placeholder: T('Type'),
    ini_type_tooltip: T('Select <i>Command</i> for an executable or\
     <i>Script</i> for an executable script.'),

    ini_command_placeholder: T('Command'),
    ini_command_tooltip: T('Enter the command with any options.'),
    ini_command_validation : [ Validators.required ],

    ini_script_placeholder: T('Script'),
    ini_script_validation : [ Validators.required ],
    ini_script_tooltip: T('Select the script from an existing pool.'),

    ini_when_placeholder: T('When'),
    ini_when_tooltip: T('Select when the command or script runs:<br>\
     <i>Pre Init</i> is early in the boot process, after mounting\
     filesystems and starting networking.<br> <i>Post Init</i> is at the\
     end of the boot process, before FreeNAS services start.<br>\
     <i>Shutdown</i> is during the system power off process.'),
    ini_when_validation : [ Validators.required ],

    ini_enabled_placeholder: T('Enabled'),
    ini_enabled_tooltip: T('Enable this task. Unset to disable the task\
     without deleting it.')
}

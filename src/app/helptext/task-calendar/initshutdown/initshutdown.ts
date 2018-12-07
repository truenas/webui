import { T } from '../../../translate-marker';
import {Validators} from '@angular/forms';

export default {
    ini_type_placeholder: T('Type'),
    ini_type_tooltip: T('Select <i>Command</i> for an executable or\
                <i>Script</i> for an executable script.'),

    ini_command_placeholder: T('Command'),
    ini_command_tooltip: T('Enter the command and any options.'),
    ini_command_validation : [ Validators.required ],

    ini_script_placeholder: T('Script'),
    ini_script_validation : [ Validators.required ],
    ini_script_tooltip: T('Browse to the script location.'),

    ini_when_placeholder: T('When'),
    ini_when_tooltip: T('Select when the command or script runs. <i>Pre Init</i>\
                is very early in the boot process before mounting\
                filesystems, <i>Post Init</i> is towards the end of the\
                boot process before FreeNAS services start, or at\
                <i>Shutdown</i>.'),
    ini_when_validation : [ Validators.required ],

    ini_enabled_placeholder: T('Enabled'),
    ini_enabled_tooltip: T('Enable this task. Unset to disable the task without\
                deleting it.')
}
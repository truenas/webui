import { T } from '../../../translate-marker';
import {Validators} from '@angular/forms';

export default {
    cron_description_placeholder: T('Description'),
    cron_description_tooltip: T('Enter a description of the cron job.'),

    cron_command_placeholder: T('Command'),
    cron_command_validation : [ Validators.required ],
    cron_command_tooltip: T('Enter the full path to the command or script to\
                be run.'),

    cron_user_placeholder: T('Run As User'),
    cron_user_tooltip: T('Select a user account to run the command. The\
                user must have permissions allowing them to run\
                the command or script.'),
    cron_user_validation : [ Validators.required ],

    cron_picker_placeholder: T('Schedule a Cron Job'),
    cron_picker_tooltip: T('Select a schedule preset or choose <i>Custom</i>\
                to open the advanced scheduler.'),
    cron_picker_validation: [ Validators.required ],

    cron_stdout_placeholder: T('Redirect Standard Output'),
    cron_stdout_tooltip: T('Redirect stdout to /dev/null. When unset, output\
                from the command is mailed to the user running\
                the cron job.'),

    cron_stderr_placeholder: T('Redirect Standard Error'),
    cron_stderr_tooltip: T('Redirect stderr to /dev/null. When unset, error\
                output from the command is mailed to the user\
                running the cron job.'),

    cron_enabled_placeholder: T('Enabled'),
    cron_enabled_tooltip: T('Enable this cron job. When unset, disable the\
                cron job without deleting it.'),
}
import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

// TODO: Remove unused.
export default {
  cron_fieldsets: [T('Cron Job')],
  cron_description_placeholder: T('Description'),
  cron_description_tooltip: T('Enter a description of the cron job.'),

  cron_command_placeholder: T('Command'),
  cron_command_validation: [Validators.required],
  cron_command_tooltip: T('Enter the full path to the command or script to\
                be run.'),

  cron_user_placeholder: T('Run As User'),
  cron_user_tooltip: T('Select a user account to run the command. The\
                user must have permissions allowing them to run\
                the command or script.'),
  cron_user_validation: [Validators.required],

  cron_picker_placeholder: T('Schedule'),
  crontab_tooltip: T('Select a schedule preset or choose <i>Custom</i> \
 to open the advanced scheduler. Note that an in-progress cron task postpones \
 any later scheduled instance of the same task until the running task is \
 complete.'),
  cron_picker_validation: [Validators.required],

  cron_stdout_placeholder: T('Hide Standard Output'),
  cron_stdout_tooltip: T('Hide standard output (stdout) from the command.\
                When unset, any standard output is mailed to the user\
                account cron used to run the command.'),

  cron_stderr_placeholder: T('Hide Standard Error'),
  cron_stderr_tooltip: T('Hide error output (stderr) from the command.\
                When unset, any error output is mailed to the user\
                account cron used to run the command.'),

  cron_enabled_placeholder: T('Enabled'),
  cron_enabled_tooltip: T('Enable this cron job. When unset, disable the\
                cron job without deleting it.'),

  cron_job_add: T('Add Cron Job'),
  cron_job_edit: T('Edit Cron Job'),
};

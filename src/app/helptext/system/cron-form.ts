import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextCron = {
  cron_description_tooltip: T('Enter a description of the cron job.'),
  cron_command_tooltip: T('Enter the full path to the command or script to\
                be run.'),
  cron_user_tooltip: T('Select a user account to run the command. The\
                user must have permissions allowing them to run\
                the command or script.'),
  crontab_tooltip: T('Select a schedule preset or choose <i>Custom</i> \
 to open the advanced scheduler. Note that an in-progress cron task postpones \
 any later scheduled instance of the same task until the running task is \
 complete.'),
  cron_stdout_tooltip: T('Hide standard output (stdout) from the command.\
                When unset, any standard output is mailed to the user\
                account cron used to run the command.'),
  cron_stderr_tooltip: T('Hide error output (stderr) from the command.\
                When unset, any error output is mailed to the user\
                account cron used to run the command.'),
  cron_enabled_tooltip: T('Enable this cron job. When unset, disable the\
                cron job without deleting it.'),
};

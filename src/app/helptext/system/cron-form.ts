import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextCron = {
  commandTooltip: T('Enter the full path to the command or script to\
                be run.'),
  userTooltip: T('Select a user account to run the command. The\
                user must have permissions allowing them to run\
                the command or script.'),
  crontabTooltip: T('Select a schedule preset or choose <i>Custom</i> \
 to open the advanced scheduler. Note that an in-progress cron task postpones \
 any later scheduled instance of the same task until the running task is \
 complete.'),
  stdoutTooltip: T('Hide standard output (stdout) from the command.\
                When unset, any standard output is mailed to the user\
                account cron used to run the command.'),
  stderrTooltip: T('Hide error output (stderr) from the command.\
                When unset, any error output is mailed to the user\
                account cron used to run the command.'),
};

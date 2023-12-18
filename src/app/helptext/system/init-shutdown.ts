import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextInitShutdown = {
  ini_type_tooltip: T('Select <i>Command</i> for an executable or\
     <i>Script</i> for an executable script.'),
  ini_command_tooltip: T('Enter the command with any options.'),
  ini_script_tooltip: T('Select the script.\
     The script will be run using\
     <a href="https://man7.org/linux/man-pages/man1/sh.1p.html"\
     target="_blank">sh(1)</a>.'),
  ini_when_tooltip: T('Select when the command or script runs:<br>\
     <i>Pre Init</i> is early in the boot process, after mounting\
     filesystems and starting networking.<br> <i>Post Init</i> is at the\
     end of the boot process, before TrueNAS services start.<br>\
     <i>Shutdown</i> is during the system power off process.'),
  ini_enabled_tooltip: T('Enable this task. Unset to disable the task\
     without deleting it.'),
  ini_timeout_tooltip: T('Automatically stop the script or command after the specified seconds.'),
  ini_description_tooltip: T('Comments about this script.'),
};

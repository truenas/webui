import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextInitShutdown = {
  typeTooltip: T('Select <i>Command</i> for an executable or\
     <i>Script</i> for an executable script.'),
  commandTooltip: T('Enter the command with any options.'),
  scriptTooltip: T('Select the script.\
     The script will be run using\
     <a href="https://man7.org/linux/man-pages/man1/sh.1p.html"\
     target="_blank">sh(1)</a>.'),
  whenTooltip: T('Select when the command or script runs:<br>\
     <i>Pre Init</i> is early in the boot process, after mounting\
     filesystems and starting networking.<br> <i>Post Init</i> is at the\
     end of the boot process, before TrueNAS services start.<br>\
     <i>Shutdown</i> is during the system power off process.'),
  timeoutTooltip: T('Automatically stop the script or command after the specified seconds.'),
};

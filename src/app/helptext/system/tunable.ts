import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemTunable = {
  metadata: {
    fieldsets: [T('Tunable')],
    fieldsets_scale: [T('Sysctl')],
  },
  var: {
    placeholder: T('Variable'),
    tooltip: T(
      'Enter the name of the loader, sysctl, or rc.conf\
 variable to configure. <i>loader</i> tunables are used\
 to specify parameters to pass to the kernel or load\
 additional modules at boot time. <i>rc.conf</i>\
 tunables are for enabling system services and daemons\
 and only take effect after a reboot. <i>sysctl</i> \
 tunables are used to configure kernel parameters while\
 the system is running and generally take effect\
 immediately.',
    ),
    validation: [Validators.required],
  },

  value: {
    placeholder: T('Value'),
    tooltip: T(
      'Enter a value to use for the <a\
 href="https://man7.org/linux/man-pages/man8/sysctl.8.html"\
 target="_blank">sysctl</a> variable.',
    ),
    validation: [Validators.required],
  },

  type: {
    placeholder: T('Type'),
    tooltip: T(
      'Creating or editing a <i>sysctl</i> immediately\
 updates the Variable to the configured Value. A restart\
 is required to apply <i>loader</i> or <i>rc.conf</i>\
 tunables. Configured tunables remain in effect until\
 deleted or Enabled is unset.',
    ),
  },

  description: {
    placeholder: T('Description'),
    tooltip: T('Enter a description of the tunable.'),
  },

  enabled: {
    placeholder: T('Enabled'),
    tooltip: T(
      'Enable this tunable. Unset to disable this tunable\
 without deleting it.',
    ),
  },
};

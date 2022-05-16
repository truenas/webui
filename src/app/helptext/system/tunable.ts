import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemTunable = {
  var: {
    tooltip: T(
      'Enter the name of the sysctl variable to configure.\
 <i>sysctl</i> tunables are used to configure kernel\
 parameters while the system is running and generally\
 take effect immediately.',
    ),
  },

  value: {
    tooltip: T(
      'Enter a value to use for the <a\
 href="https://man7.org/linux/man-pages/man8/sysctl.8.html"\
 target="_blank">sysctl</a> variable.',
    ),
  },

  type: {
    tooltip: T(
      'Creating or editing a <i>sysctl</i> immediately\
 updates the Variable to the configured Value. A restart\
 is required to apply <i>loader</i> or <i>rc.conf</i>\
 tunables. Configured tunables remain in effect until\
 deleted or Enabled is unset.',
    ),
  },

  description: {
    tooltip: T('Enter a description of the tunable.'),
  },

  enabled: {
    tooltip: T(
      'Enable this tunable. Unset to disable this tunable\
 without deleting it.',
    ),
  },
};

import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemTunable = {
  varTooltip: T(
    'Enter the name of the sysctl variable to configure.\
 <i>sysctl</i> tunables are used to configure kernel\
 parameters while the system is running and generally\
 take effect immediately.',
  ),

  valueTooltip: T(
    'Enter a value to use for the <a\
 href="https://man7.org/linux/man-pages/man8/sysctl.8.html"\
 target="_blank">sysctl</a> variable.',
  ),

  enabledTooltip: T(
    'Enable this tunable. Unset to disable this tunable\
without deleting it.',
  ),
};

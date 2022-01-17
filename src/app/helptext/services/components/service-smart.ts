import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  smart_fieldset_general: T('General Options'),

  smart_interval_placeholder: T('Check Interval'),
  smart_interval_tooltip: T('Define a number of minutes for <a\
 href="https://linux.die.net/man/8/smartd"\
 target="_blank">smartd</a> to wake up and check if any\
 tests are configured to run.'),

  smart_powermode_placeholder: T('Power Mode'),
  smart_powermode_tooltip: T('Tests are only performed when <i>Never</i> \
is selected.'),

  smart_difference_placeholder: T('Difference'),
  smart_difference_tooltip: T('Enter a number of degrees in Celsius. SMART reports if\
 the temperature of a drive has changed by N degrees\
 Celsius since the last report.'),

  smart_informational_placeholder: T('Informational'),
  smart_informational_tooltip: T('Enter a threshold temperature in Celsius. SMART will\
 message with a log level of LOG_INFO if the\
 temperature is higher than the threshold.'),

  smart_critical_placeholder: T('Critical'),
  smart_critical_tooltip: T('Enter a threshold temperature in Celsius. SMART will\
 message with a log level of LOG_CRIT and send an email\
 if the temperature is higher than the threshold.'),
  formTitle: T('S.M.A.R.T.'),
};

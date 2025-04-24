import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextScrubForm = {
  scrubThresholdTooltip: T('Days before a completed scrub is allowed \
 to run again. This controls the task schedule. For example, scheduling \
 a scrub to run daily and setting <b>Threshold days</b> to <i>7</i> \
 means the scrub attempts to run daily. When the scrub is successful, it \
 continues to check daily but does not run again until seven days have \
 elapsed. Using a multiple of seven ensures the scrub always occurs on \
 the same weekday.'),
  scrubEnabledTooltip: T('Unset to disable the scheduled scrub \
 without deleting it.'),
};

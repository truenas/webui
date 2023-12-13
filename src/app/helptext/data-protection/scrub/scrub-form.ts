import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextScrubForm = {
  scrub_volume_tooltip: T('Choose a pool to scrub.'),
  scrub_threshold_tooltip: T('Days before a completed scrub is allowed \
 to run again. This controls the task schedule. For example, scheduling \
 a scrub to run daily and setting <b>Threshold days</b> to <i>7</i> \
 means the scrub attempts to run daily. When the scrub is successful, it \
 continues to check daily but does not run again until seven days have \
 elapsed. Using a multiple of seven ensures the scrub always occurs on \
 the same weekday.'),
  scrub_description_tooltip: T('Describe the scrub task.'),
  scrub_picker_tooltip: T('How often to run the scrub task. Choose one \
 of the presets or choose <i>Custom</i> to use the advanced scheduler.'),
  scrub_enabled_tooltip: T('Unset to disable the scheduled scrub \
 without deleting it.'),

};

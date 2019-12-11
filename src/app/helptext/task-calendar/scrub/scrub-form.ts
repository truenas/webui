import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
    scrub_fieldsets: [T('Scrub Task')],
    scrub_volume_placeholder: T('Pool'),
    scrub_volume_tooltip : T('Choose a pool to scrub.'),
    scrub_volume_validation : [ Validators.required ],

    scrub_threshold_placeholder: T('Threshold days'),
    scrub_threshold_tooltip: T('Days before a completed scrub is allowed \
 to run again. This controls the task schedule. For example, scheduling \
 a scrub to run daily and setting <b>Threshold days</b> to <i>7</i> \
 means the scrub attempts to run daily. When the scrub is successful, it \
 continues to check daily but does not run again until seven days have \
 elapsed. Using a multiple of seven ensures the scrub always occurs on \
 the same weekday.'),
    scrub_threshold_validation: [ Validators.min(0), Validators.required ],

    scrub_description_placeholder: T('Description'),
    scrub_description_tooltip : T('Describe the scrub task.'),

    scrub_picker_placeholder: T('Schedule the Scrub Task'),
    scrub_picker_tooltip: T('Choose how often to run the scrub task. \
 Choices are <i>Hourly</i>, <i>Daily</i>, <i>Weekly</i>, <i>Monthly</i>, \
 or <i>Custom</i>. Select <i>Custom</i> to open a visual scheduler for \
 selecting minutes, hours, days, month, and days of week. Spaces are not \
 allowed in <b>Minutes</b>, <b>Hours</b>, or <b>Days</b> of the custom \
 scheduler.'),

    scrub_enabled_placeholder: T('Enabled'),
    scrub_enabled_tooltip : T('Unset to disable the scheduled scrub \
 without deleting it.'),

}

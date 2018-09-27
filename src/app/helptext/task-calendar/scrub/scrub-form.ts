import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
    scrub_volume_placeholder: T('Pool'),
    scrub_volume_tooltip : T('Choose a pool to scrub.'),
    scrub_volume_validation : [ Validators.required ],

    scrub_threshold_placeholder: T('Threshold days'),
    scrub_threshold_tooltip: T('Define the number of days to prevent a scrub from\
                running after the last has completed. This ignores any\
                other calendar schedule. The default is a multiple of\
                7 to ensure the scrub always occurs on the same\
                weekday.'),
    scrub_threshold_validation: [ Validators.min(0), Validators.required ],

    scrub_description_placeholder: T('Description'),
    scrub_description_tooltip : T('Describe the scrub task.'),

    scrub_picker_placeholder: T('Schedule the Scrub Task'),
    scrub_picker_tooltip: T('Choose one of the convenient presets\
      or choose <b>Custom</b> to trigger the advanced scheduler UI'),

    scrub_enabled_placeholder: T('Enabled'),
    scrub_enabled_tooltip : T('Unset to disable the scheduled scrub without\
                 deleting it.'),

}
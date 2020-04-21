import { T } from '../../../translate-marker';
import {Validators} from '@angular/forms';

export default {
    fieldset_resilver: T('Resilver Priority'),

    enabled_placeholder: T('Enabled'),
    enabled_tooltip: T('Set to run resilver tasks between the configured times.'),

    begin_placeholder: T('Begin'),
    begin_tooltip: T('Choose the hour and minute when resilver tasks can be\
                started.'),

    end_placeholder: T('End'),
    end_tooltip: T('Choose the hour and minute when new resilver tasks\
                are not allowed to start. This does not affect active\
                resilver tasks.'),

    weekday_placeholder: T('Days of the Week'),
    weekday_tooltip: T('Select the days to run resilver tasks.'),
    weekday_validation : [ Validators.required ]
}

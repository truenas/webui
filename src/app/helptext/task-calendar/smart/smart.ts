import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
    smarttest_all_disks_placeholder: T('All Disks'),
    smarttest_all_disks_tooltip: T(''),

    smarttest_disks_placeholder: T('Disks'),
    smarttest_disks_tooltip : T('Select the disks to monitor.'),
    smarttest_disks_validation : [ Validators.required ],

    smarttest_type_placeholder: T('Type'),
    smarttest_type_tooltip : T('Choose the test type. See <a\
                href="https://www.smartmontools.org/browser/trunk/smartmontools/smartctl.8.in"\
                target="_blank">smartctl(8)</a> for descriptions of\
                each type. Some types will degrade performance or\
                take disks offline. Avoid scheduling S.M.A.R.T. tests\
                simultaneously with scrub or resilver operations.'),
    smarttest_type_validation : [ Validators.required ],

    smarttest_desc_placeholder: T('Description'),
    smarttest_desc_tooltip : T('Enter any information about this S.M.A.R.T. test.'),

    smarttest_picker_placeholder: T('Schedule'),
    smarttest_picker_tooltip: T('Choose one of the presets or select <i>Custom</i> \
 to open the advanced scheduler.'),
    smarttest_picker_validation: [ Validators.required ],

    smartlist_column_disks: T('Disks'),
    smartlist_column_type: T('Type'),
    smartlist_column_description: T('Description'),
    smartlist_column_schedule: T('Schedule'),
    smartlist_column_next_run: T('Next Run'),
    smartlist_column_delete_title: T('S.M.A.R.T. Test')
}

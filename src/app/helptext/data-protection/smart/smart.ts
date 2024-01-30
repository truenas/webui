import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSmart = {
  smarttest_all_disks_placeholder: T('All Disks'),

  smarttest_disks_tooltip: T('Select the disks to monitor.'),
  smarttest_type_tooltip: T('Choose the test type. See <a\
                href="https://www.smartmontools.org/browser/trunk/smartmontools/smartctl.8.in"\
                target="_blank">smartctl(8)</a> for descriptions of\
                each type. Some types will degrade performance or\
                take disks offline. Avoid scheduling S.M.A.R.T. tests\
                simultaneously with scrub or resilver operations.'),
  smarttest_desc_tooltip: T('Enter any information about this S.M.A.R.T. test.'),
  smarttest_picker_tooltip: T('Choose one of the presets or select <i>Custom</i> \
 to open the advanced scheduler.'),

  smartlist_column_disks: T('Disks'),
  smartlist_column_type: T('Type'),
  smartlist_column_description: T('Description'),
  smartlist_column_schedule: T('Schedule'),
  smartlist_column_frequency: T('Frequency'),
  smartlist_column_next_run: T('Next Run'),
};

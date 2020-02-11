import { T } from '../translate-marker';

export default {
    copyright_year: '2020',
    dockerhost: T('Docker Host'),

    ctrlr: T('TrueNAS controller'),
    ctrlrs: T('TrueNAS controllers'),
    Ctrlr: T('TrueNAS Controller'),
    Ctrlrs: T('TrueNAS Controllers'),
    thisCtlr: T('This Controller'),
    unknownCtrl: T('The active controller cannot be detected.'),

    legacyUIWarning: T('The legacy user interface is deprecated.\
 All management should be performed through the new user interface.'),

sys_update_message: T('This system will restart when the update completes.'),

human_readable: {
    input_error: T('Invalid value. Valid values are numbers followed by optional unit letters, \
 like <code>256k</code> or <code>1 G</code> or <code>2 MiB</code>.'),

  suggestion_tooltip: T(`This field accepts human-readable input (Ex. 50 GiB, 500M, 2 TB). \
  If units are not specified, the value defaults to`),
  
  suggestion_label: '(Examples: 500 KiB, 500M, 2 TB)',
},

noLogDilaog: {
    title: T('No Logs'),
    message: T('No logs are available for this task.'),
},

ha_connecting_text: T('Waiting for active TrueNAS controller to come up...'),

fieldset_general_options: T('General Options'),
fieldset_other_options: T('Other Options'),

hostname: T('Hostname'),

scheduler: {
    general: {
        header: T('Mintues/Hours/Days'),
        headerWithoutMinutes: T('Hours/Days'),
        tooltip: T('The time values when the task will run. Accepts standard\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=crontab" target="_blank">crontab(5)</a> values.\
 </br></br>Symbols:</br> A comma (,) separates individual values.</br> An asterisk (*) means \
 "match all values".</br> Hyphenated numbers (1-5) sets a range of time.</br> A slash (/)\
 designates a step in the value: */2 means every other minute.</br></br> Example: 30-35 in Minutes, 1,14 in Hours,\
 and */2 in Days means the task will run on 1:30 - 1:35 AM and 2:30 - 2:35 PM every other day.'),
    },
    minutes: {
        header: T('Mintues'),
        tooltip: T('Minutes when this task will run.'),
    },
    hours: {
        header: T('Hours'),
        tooltip: T('Hours when this task will run.'),
    },
    days: {
        header: T('Days'),
        tooltip: T('Days when this task will run.'),
    }
},

invalidInputValueWithUnit: T('Invalid value. Missing numerical value or invalid numerical value/unit.'),
}

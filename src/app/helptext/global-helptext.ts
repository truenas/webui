import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextGlobal = {
  dockerhost: T('Docker Host'),

  Ctrlr: T('TrueNAS Controller'),
  sysUpdateMessage: T('A system update is in progress. It might have been launched in another window or by an external source like TrueCommand.'),
  sysUpdateMessagePt2: T('This system will restart when the update completes.'),

  human_readable: {
    input_error: T('Invalid value. Valid values are numbers followed by optional unit letters, \
 like <code>256k</code> or <code>1 G</code> or <code>2 MiB</code>.'),

    suggestion_tooltip: T('This field accepts human-readable input (Ex. 50 GiB, 500M, 2 TB). \
  If units are not specified, the value defaults to'),

    suggestion_label: T('(Examples: 500 KiB, 500M, 2 TB)'),
  },

  noLogDialog: {
    title: T('No Logs'),
    message: T('No logs are available for this task.'),
  },

  scheduler: {
    general: {
      header: T('Minutes/Hours/Days'),
      headerWithoutMinutes: T('Hours/Days'),
      tooltip: T('The time values when the task will run. Accepts standard\
 <a href="https://man7.org/linux/man-pages/man5/crontab.5.html" target="_blank">crontab(5)</a> values.\
 </br></br>Symbols:</br> A comma (,) separates individual values.</br> An asterisk (*) means \
 "match all values".</br> Hyphenated numbers (1-5) sets a range of time.</br> A slash (/)\
 designates a step in the value: */2 means every other minute.</br></br> Example: 30-35 in Minutes, 1,14 in Hours,\
 and */2 in Days means the task will run on 1:30 - 1:35 AM and 2:30 - 2:35 PM every other day.'),
    },
    minutes: {
      header: T('Minutes'),
      tooltip: T('Minutes when this task will run.'),
    },
    hours: {
      header: T('Hours'),
      tooltip: T('Hours when this task will run.'),
    },
    days: {
      header: T('Days'),
      tooltip: T('Days when this task will run.'),
    },
    orTooltip: T('When both days of month and days of week have restrictions, these restrictions work as an OR condition.'),
  },

  basic_options: T('Basic Options'),
  advanced_options: T('Advanced Options'),

  invalidInputValueWithUnit: T('Invalid value. Missing numerical value or invalid numerical value/unit.'),
  invalidInputValueWithMin: T('Invalid value. Must be greater than or equal to '),
  invalidInputValueWithMax: T('Invalid value. Must be less than or equal to '),

  pasteValueStartsWithSpace: T('The pasted string starts with a space'),
  pasteValueEndsWithSpace: T('The pasted string ends with a space'),
};

import { T } from "app/translate-marker";
import { regexValidator } from '../../pages/common/entity/entity-form/validators/regex-validation';
import { rangeValidator } from '../../pages/common/entity/entity-form/validators/range-validation';

export const helptext = {
fieldset_general: T('General Options'),
cpu_in_percentage_placeholder: T('Report CPU usage in percent'),
cpu_in_percentage_tooltip: T('When set, report CPU usage in percent \
 instead of units of kernel time.'),

graphite_placeholder: T('Remote Graphite Server Hostname'),
graphite_tooltip: T('Hostname or IP address of a remote  \
 <a href="http://graphiteapp.org/" target="_blank">Graphite</a> server.'),

graph_age_placeholder: T('Graph Age in Months'),
graph_age_tooltip: T('Maximum time a graph is stored in months (allowed values are 1-60). \
 Changing this value causes the <i>Confirm RRD Destroy</i> \
 dialog to appear. Changes do not take effect until the existing \
 reporting database is destroyed.'),
graph_age_validation: [regexValidator(/^\d+$/), rangeValidator(1, 60 )  ],

graph_points_placeholder: T('Number of Graph Points'),
graph_points_tooltip: T('Number of points for each hourly, daily, \
 weekly, monthly, or yearly graph (allowed values are 1-4096). Changing this value causes the \
 <i>Confirm RRD Destroy</i> dialog to appear. Changes do not take \
 effect until the existing reporting database is destroyed.'),
graph_points_validation: [regexValidator(/^\d+$/), rangeValidator(1, 4096 ) ],

reset_button: T('Reset to Defaults'),
dialog: {
    title: T('Change Settings and Clear Report History?'),
    message: T('Report history is cleared when <i>CPU reporting</i>, <i>Graph Age</i>, \
 or <i>Graph Points</i> are changed.'),
    action: T('Continue')
},
graphite_separateinstances_placeholder: T('Graphite Separate Instances'),
graphite_separateinstances_tooltip:T("Enabling sends the \
 <i>plugin instance</i> and <i>type instance</i> to Graphite as separate \
 path components: <i>host.cpu.0.cpu.idle</i>.<br><br> Disabling sends \
 the <i>plugin</i> and <i>plugin instance</i> as one path component and \
 <i>type</i> and <i>type instance</i> as another component: \
 <i>host.cpu-0.cpu-idle</i>.")
}

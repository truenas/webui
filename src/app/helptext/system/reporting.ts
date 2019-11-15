import { T } from "app/translate-marker";
import { regexValidator } from '../../pages/common/entity/entity-form/validators/regex-validation';

export const helptext = {
cpu_in_percentage_placeholder: T('Report CPU usage in percent'),
cpu_in_percentage_tooltip: T('When set, report CPU usage in percent instead of jiffies.'),

graphite_placeholder: T('Remote Graphite Server Hostname'),
graphite_tooltip: T('Hostname or IP address of a remote  \
 <a href="http://graphiteapp.org/" target="_blank">Graphite</a> server.'),

graph_age_placeholder: T('Graph Age'),
graph_age_tooltip: T('Maximum time a graph is stored in months. \
 Changing this value causes the <i>Confirm RRD Destroy</i> \
 checkbox to appear. Changes do not take effect until the existing \
 reporting database is destroyed.'),
graph_age_validation: [regexValidator(/^\d+$/) ],

graph_points_placeholder: T('Graph Points'),
graph_points_tooltip: T('Number of points for each hourly, daily, \
 weekly, monthly, or yearly graph. Do not set this less than the \
 width of the graphs in pixels. Changing this value causes the \
 <i>Confirm RRD Destroy</i> checkbox to appear. Changes do not take \
 effect until the existing reporting database is destroyed.'),
graph_points_validation: [regexValidator(/^\d+$/) ],

confirm_rrd_destroy_placeholder: T('Confirm RRD Destroy'),
confirm_rrd_destroy_tooltip: T('Destroy the reporting database. Only \
 appears when <i>Graph Age</i> or <i>Graph Points</i> are \
 changed. Required for changes to <i>Graph Age</i> or \
 <i>Graph Points</i> to take effect.')
}

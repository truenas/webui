import { T } from "app/translate-marker";

export const helptext = {
cpu_in_percentage_placeholder: T('Report CPU usage in percent'),
cpu_in_percentage_tooltip: T('When set, report CPU usage in percent instead of jiffies.'),

graphite_placeholder: T('Graphite Server'),
graphite_tooltip: T('Destination hostname or IP for collectd data sent\
 by the Graphite plugin.'),
    
graph_age_placeholder: T('Graph Age'),
graph_age_tooltip: T('Maximum age of graph stored, in months.'),

graph_points_placeholder: T('Graph Points'),
graph_points_tooltip: T('Number of points for each hourly, daily, weekly, monthly,\
 or yearly graph. Set this to no less than the width of the graphs in pixels.'),

confirm_rrd_destroy_placeholder: T('Confirm RRD Destroy'),
confirm_rrd_destroy_tooltip: T('Destroy the reporting database. Required for changes\
 to <b>Graph Age</b> and <b>Graph Points</b> to take effect.'),

}

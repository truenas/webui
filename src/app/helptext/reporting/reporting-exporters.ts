import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextReportingExporters = {
  name: T('Give your exporter configuration a name'),
  type: T('Monitoring system that receives the exported metrics.'),
  enabled: T('Send metrics to this exporter. Unset to keep the configuration without exporting anything.'),

  /** Keyed by the field names `reporting.exporters.exporter_schemas` returns. */
  attributes: {
    destination_ip: T('IP address of the Graphite server that receives the metrics.'),
    destination_port: T('Port the Graphite server listens on for metrics, usually <i>2003</i>.'),
    prefix: T('Prepended to every metric name, so the metrics are grouped together on the Graphite server.\
 Defaults to <i>scale</i>.'),
    namespace: T('Identifies this system in the metric names, after the prefix.\
 Metrics are sent as <i>prefix.namespace.chart.dimension</i>.'),
    update_every: T('How often, in seconds, metrics are sent to the Graphite server. Defaults to <i>1</i>.'),
    buffer_on_failures: T('Number of updates to keep while the Graphite server is unreachable.\
 Older metrics are dropped once the buffer is full. Defaults to <i>10</i>.'),
    send_names_instead_of_ids: T('Use human-readable chart and dimension names in metric names\
 instead of their internal IDs.'),
    matching_charts: T('Space-separated list of chart patterns to export. Use <i>*</i> as a wildcard\
 and prefix a pattern with <i>!</i> to exclude it, for example <i>!disk.* *</i>.\
 Defaults to <i>*</i> (all charts).'),
  } as Record<string, string>,
};

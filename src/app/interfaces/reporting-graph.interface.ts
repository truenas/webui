import { ReportingGraphName } from 'app/enums/reporting.enum';

export interface ReportingGraph {
  identifiers: string[];
  name: ReportingGraphName;
  title: string;
  vertical_label: string;
}

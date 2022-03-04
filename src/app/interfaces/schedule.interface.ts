export interface Schedule {
  // TODO: Check question marks
  minute?: string;
  hour?: string;
  dom?: string;
  month?: string;
  dow?: string;
  // TODO: May not belong here.
  begin?: string;
  end?: string;
}

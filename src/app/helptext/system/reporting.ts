import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptext = {
  graph_age_tooltip: T('Maximum time a graph is stored in months (allowed values are 1-60). \
 Changing this value causes the <i>Confirm RRD Destroy</i> \
 dialog to appear. Changes do not take effect until the existing \
 reporting database is destroyed.'),
  graph_points_tooltip: T('Number of points for each hourly, daily, \
 weekly, monthly, or yearly graph (allowed values are 1-4096). Changing this value causes the \
 <i>Confirm RRD Destroy</i> dialog to appear. Changes do not take \
 effect until the existing reporting database is destroyed.'),

  dialog: {
    title: T('Change Settings and Clear Report History?'),
    message: T('Report history is cleared when <i>Graph Age</i>, or <i>Graph Points</i> are changed.'),
    action: T('Continue'),
  },
};

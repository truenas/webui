import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextApiKeys = {
  name: {
    tooltip: T('Descriptive identifier for this API key.'),
  },

  username: {
    tooltip: T('Username associated with this API key.'),
  },

  reset: {
    tooltip: T('Remove the existing API key and generate a new random key.\
 A dialog shows the new key and has an option to copy the key. Back up and\
 secure the API key! The key string is displayed only one time, at creation.'),
  },
};

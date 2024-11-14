import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextApiKeys = {
  name: {
    tooltip: T('Descriptive identifier for this API key.'),
  },

  expires: {
    tooltip: T('Set an expiration date-time for the API key.'),
  },

  username: {
    tooltip: T('Username associated with this API key.'),
  },

  nonExpiring: {
    tooltip: T('Enable this to create a token with no expiration date. The token will stay active\
 until it is manually revoked or updated.'),
  },

  reset: {
    tooltip: T('Remove the existing API key and generate a new random key.\
 A dialog shows the new key and has an option to copy the key. Back up and\
 secure the API key! The key string is displayed only one time, at creation.'),
  },
};

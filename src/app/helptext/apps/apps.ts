import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextApps = {
  choosePool: {
    unsetPool: {
      confirm: {
        title: T('Unset Pool'),
        message: T('Confirm to unset pool?'),
        button: T('Unset'),
      },
    },
  },

  message: {
    loading: T('Loading...'),
    not_running: T('Applications are not running'),
    no_search_result: T('No Search Results.'),
    no_installed: T('No Applications Installed'),
  },

  dockerRegistries: {
    tooltip: T('Signing in to a registry, such as Docker Hub, is not required for Apps to function, but may help if you experience rate limiting issues.'),
  },

  installing: T('Installing'),
  updating: T('Updating'),
  refreshing: T('Refreshing'),
  starting: T('Starting'),
  stopping: T('Stopping'),
  settings: T('Settings'),
  choose: T('Choose Pool'),
  advanced: T('Advanced Settings'),

  dockerSettings: {
    addressPoolsSize: T('Network size of each docker network which will be cut off from base subnet.'),
  },

  bulkActions: {
    title: T('Bulk actions'),
    finished: T('Requested action performed for selected Applications'),
  },

  noPool: {
    title: T('No Pools Found'),
    message: T('At least one pool must be available to use apps'),
    action: T('Create Pool'),
  },

  apps: {
    delete_dialog: {
      job: T('Deleting...'),
    },

    upgrade_dialog: {
      job: T('Upgrading...'),
    },

    rollback_dialog: {
      version: {
        tooltip: T('Enter the version to roll back to.'),
      },

      job: T('Rolling back...'),
    },
  },

  appForm: {
    parseError: {
      title: T('Error'),
      message: T('Error detected reading App'),
    },
    release_name: {
      name: T('Name'),
      placeholder: T('Application Name'),
      tooltip: T('Application name must have the following: \
 1) Lowercase alphanumeric characters can be specified \
 2) Name must start with an alphabetic character and can end with alphanumeric character \
 3) Hyphen \'-\' is allowed but not as the first or last character e.g abc123, abc, abcd-1232'),
    },
  },

  appWizard: {
    nameGroup: {
      version: T('Version'),
      nameValidationRules: T('Name must start and end with a lowercase alphanumeric character. \
 Hyphen is allowed in the middle e.g abc123, abc, abcd-1232'),
    },
  },

  catalogForm: {
    title: T('Add Catalog'),
    name: {
      tooltip: T('Please specify name to be used to lookup catalog.'),
    },
    repository: {
      tooltip: T('Please specify a valid git repository uri.'),
    },
    preferredTrains: {
      tooltip: T('Please specify trains from which UI should retrieve available applications for the catalog.'),
    },
    installNvidiaDriver: {
      tooltip: T('Please specify whether to install NVIDIA driver or not.'),
    },
    branch: {
      tooltip: T('Please specify branch of git repository to use for the catalog.'),
    },
  },

  pullImageForm: {
    imageName: {
      tooltip: T('Please specify the name of the image to pull. Format for the name is "registry/repo/image"'),
    },
  },
  dockerHubRateLimit: {
    message: T('User limit to Docker Hub has almost been reached or has already been reached. The installation\
     process may stall as images cannot be pulled. The current limit will be renewed in {seconds}. The application\
      can still be staged for installation.'),
  },

  ports: T('Host ports are listed on the left and associated container ports are on the right.\
  \
  0.0.0.0 on the host side represents binding to any IP address on the host.'),
};

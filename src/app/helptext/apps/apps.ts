import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  choosePool: {
    title: T('Choose a pool for Apps'),
    placeholder: T('Pools'),
    migrateApplications: T('Migrate applications to the new pool'),
    action: T('Choose'),
    jobTitle: T('Configuring...'),
    success: T('Success'),
    unsetPool: {
      label: T('Unset Pool'),
      confirm: {
        title: T('Unset Pool'),
        message: T('Confirm to unset pool?'),
        button: T('Unset'),
      },
    },
  },

  message: {
    loading: T('Loading...'),
    not_configured: T('Applications not configured'),
    not_running: T('Applications are not running'),
    no_search_result: T('No Search Results.'),
    no_installed: T('No Applications Installed'),
    no_installed_message: T('Applications you install will automatically appear here. Click below and browse the TrueNAS catalog to get started.'),
  },

  catalogMessage: {
    loading: T('Loading...'),
    no_search_result: T('No Search Results.'),
    no_catalog: T('Unable to retrieve Available Applications'),
    no_application: T('No Applications are Available'),
  },

  installing: T('Installing'),
  updating: T('Updating'),
  refreshing: T('Refreshing'),
  starting: T('Starting'),
  stopping: T('Stopping'),
  settings: T('Settings'),
  choose: T('Choose Pool'),
  advanced: T('Advanced Settings'),
  unset_pool: T('Unset Pool'),

  bulkActions: {
    success: T('Success'),
    error: T('Error'),
    no_selected: T('Please select the applications'),
    title: T('Bulk actions'),
    finished: T('Requested action performed for selected Applications'),
    failed: T('Failed to do bulk actions'),
    unSelectAll: T('Unselect All'),
    selectAll: T('Select All'),
    options: [
      {
        value: 'select_all',
        label: T('Select All') as string,
        icon: 'check_circle',
        disabled: false,
      },
      {
        value: 'start',
        label: T('Start'),
        icon: 'play_arrow',
        disabled: false,
      },
      {
        value: 'stop',
        label: T('Stop'),
        icon: 'stop',
        disabled: false,
      },
      {
        value: 'delete',
        label: T('Delete'),
        icon: 'delete',
        disabled: false,
      },
    ],
  },

  launch: T('Launch Docker Image'),
  catalogs: T('Catalogs'),

  noPool: {
    title: T('No Pools Found'),
    message: T('At least one pool must be available to use apps'),
    action: T('Create Pool'),
  },

  kubForm: {
    title: T('Kubernetes Settings'),
    reInit: {
      title: T('Settings Requiring Re-Initialization'),
      formWarning: T('Changing settings below will result in Kubernetes cluster re-initialization deleting installed apps and their data.'),
      modalWarning: T('You have changed one of the settings that require Kubernetes cluster re-initialization. Please be aware that this will delete installed apps and their data.'),
    },
    validateHostPathWarning: {
      title: T('Warning'),
      modalWarning: T('Disabling validation of host path can result in a data loss.'),
    },
    cluster_cidr: {
      placeholder: T('Cluster CIDR'),
      tooltip: T(''),
    },
    service_cidr: {
      placeholder: T('Service CIDR'),
      tooltip: T(''),
    },
    cluster_dns_ip: {
      placeholder: T('Cluster DNS IP'),
      tooltip: T(''),
    },
    node_ip: {
      placeholder: T('Node IP'),
      tooltip: T(''),
    },
    route_v4_interface: {
      placeholder: T('Route v4 Interface'),
      tooltip: T(''),
    },
    route_v4_gateway: {
      placeholder: T('Route v4 Gateway'),
      tooltip: T(''),
    },
    route_v6_interface: {
      placeholder: T('Route v6 Interface'),
      tooltip: T(''),
    },
    route_v6_gateway: {
      placeholder: T('Route v6 Gateway'),
      tooltip: T(''),
    },
    enable_container_image_update: {
      placeholder: T('Enable Container Image Updates'),
      tooltip: T(''),
    },
    configure_gpus: {
      placeholder: T('Enable GPU support'),
    },
  },

  charts: {
    delete_dialog: {
      title: T('Delete'),
      job: T('Deleting...'),
    },

    upgrade_dialog: {
      title: T('Upgrade'),
      job: T('Upgrading...'),
    },

    rollback_dialog: {
      version: {
        tooltip: T('Enter the version to roll back to.'),
      },

      job: T('Rolling back...'),
    },
  },

  chartForm: {
    title: T('Install Application'),
    editTitle: T('Edit Application Settings'),
    parseError: {
      title: T('Error'),
      message: T('Error detected reading App'),
    },
    catalog: {
      placeholder: T('Catalog'),
      tooltip: T(''),
    },
    item: {
      placeholder: T('Item'),
      tooltip: T(''),
    },
    release_name: {
      name: T('Name'),
      placeholder: T('Application Name'),
      tooltip: T(''),
    },
    networking: T('Networking'),
    externalLabel: T('Add External Interfaces'),
  },

  chartWizard: {
    nameGroup: {
      label: 'Application Name',
      version: 'Version',
    },
  },

  podConsole: {
    nopod: {
      title: T('No Pods Found'),
      message: T('At least one pod must be available'),
    },
    choosePod: {
      title: T('Choose pod'),
      placeholder: T('Pods'),
      action: T('Choose'),
    },
    chooseContainer: {
      title: T('Choose container'),
      placeholder: T('Containers'),
    },
    chooseCommand: {
      placeholder: T('Commands'),
    },
  },

  podLogs: {
    title: T('Choose log'),
    chooseBtn: T('Choose'),
    downloadBtn: T('Download Logs'),
    nopod: {
      title: T('No Pods Found'),
      message: T('Invalid Pod name'),
    },
    chooseApp: {
      placeholder: T('Apps'),
    },
    choosePod: {
      placeholder: T('Pods'),
    },
    chooseContainer: {
      placeholder: T('Containers'),
    },
    tailLines: {
      placeholder: T('Tail Lines'),
    },
  },

  actionBtnText: {
    close: T('Close'),
    refreshEvents: T('Refresh Events'),
  },

  chartEventDialog: {
    noPorts: T('No ports are being used.'),
    statusUpToDate: T('Up to date'),
    statusUpdateAvailable: T('Update available'),
    containerImageStatusUpdateAvailableTo: T('Following container images are available to update:\n'),
    statusUpdateAvailableTo: T('Available version:\n'),
    tooltipHeader: T('Container Images'),
  },

  manageCatalogs: {
    menu: {
      edit: T('Edit'),
      refresh: T('Refresh'),
      delete: T('Delete'),
      summary: T('Summary'),
    },
  },

  dockerImages: {
    menu: {
      update: T('Update Image'),
      forceDelete: T('Force delete'),
      delete: T('Delete'),
    },
    columns: {
      id: T('Image ID'),
      tags: T('Tags'),
      state: '',
    },
    updateAvailable: T('Update Available'),
    chooseTag: {
      title: T('Choose a Tag'),
      selectTag: {
        placeholder: T('Please select a tag'),
      },
      action: T('Choose'),
    },
    pulling: T('Pulling...'),
  },
  thirdPartyRepoWarning: {
    btnMsg: T('Continue'),
    cancelMsg: T('Cancel'),
    title: T('Warning'),
    message: T(`iXsystems does not audit or otherwise validate the contents of third-party applications catalogs. \
    It is incumbent on the user to verify that the new catalog is from a trusted source and that the third-party \
    properly audits its chart contents. Failure to exercise due diligence may expose the user and their data to \
    some or all of the following:<br/>\
    <ul>
      <li>Malicious software</li>
      <li>Broken services on TrueNAS host</li>
      <li>Service disruption on TrueNAS host</li>
      <li>Broken filesystem permissions on Host or within application</li>
      <li>Unexpected deletion of user data</li>
      <li>Unsafe service configuration in application</li>
      <li>Degradation of TrueNAS host performance and stability</li>
    </ul>`),
  },

  catalogForm: {
    title: T('Add Catalog'),
    editTitle: T('Edit Catalog'),
    name: {
      placeholder: T('Catalog Name'),
      tooltip: T('Please specify name to be used to lookup catalog.'),
    },
    forceCreate: {
      placeholder: T('Force Create'),
      tooltip: T('Add catalog to system even if some trains are unhealthy.'),
    },
    repository: {
      placeholder: T('Repository'),
      tooltip: T('Please specify a valid git repository uri.'),
    },
    preferredTrains: {
      placeholder: T('Preferred Trains'),
      tooltip: T('Please specify trains from which UI should retrieve available applications for the catalog.'),
    },
    branch: {
      placeholder: T('Branch'),
      tooltip: T('Please specify branch of git repository to use for the catalog.'),
    },
    dialog: {
      title: 'Success',
      message: 'Adding large catalogs can take minutes. Please check on the progress in Task Manager.',
    },
  },

  pullImageForm: {
    username: {
      tooltip: T('Please input user name.'),
    },
    password: {
      tooltip: T('Please input password.'),
    },
    imageName: {
      tooltip: T('Please specify the name of the image to pull. Format for the name is "registry/repo/image"'),
    },
    imageTags: {
      tooltip: T('Please specifies tag of the image'),
    },
  },
};

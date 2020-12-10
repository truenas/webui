import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';

export default {
  choosePool: {
    title: T('Choose a pool for Apps'),
    placeholder: T('Pools'),
    action: T('Choose'),
    jobTitle: T('Configuring...'),
    success: T('Success'),
    message: T('Using pool ')
  },

  installing: T('Installing'),
  settings: T('Settings'),
  choose: T('Choose Pool'),
  advanced: T('Advanced Settngs'),

  launch: T('Launch Docker Image'),

  install: {
    title: T('Ready to Install'),
    msg1: T('Install '),
    msg2: T(' on pool ')
  },

  noPool: {
    title: T('No Pools Found'),
    message: T('At least one pool must be available to use apps'),
    action: T('Create Pool')
  },

  kubForm: {
    title: T('Kubernetes Settings'),
    pool: {
      placeholder: T('Pool'),
      tooltip: T('Choose a pool for the Apps')
    },
    cluster_cidr: {
      placeholder: T('Cluster CIDR'),
      tooltip: T('')
    },
    service_cidr: {
      placeholder: T('Service CIDR'),
      tooltip: T('')
    },
    cluster_dns_ip: {
      placeholder: T('Cluster DNS IP'),
      tooltip: T('')
    },
    node_ip: {
      placeholder: T('Node IP'),
      tooltip: T('')
    },
    route_v4_interface: {
      placeholder: T('Route v4 Interface'),
      tooltip: T('')
    },
    route_v4_gateway: {
      placeholder: T('Route v4 Gateway'),
      tooltip: T('')
    },
    route_v6_interface: {
      placeholder: T('Route v6 Interface'),
      tooltip: T('')
    },
    route_v6_gateway: {
      placeholder: T('Route v6 Gateway'),
      tooltip: T('')
    }
  },

  charts: {
    delete_dialog: {
      title: T('Delete'),
      msg: T('Delete '),
      job: T('Deleting...') 
    },

    update_dialog: {
      title: T('Update'),
      msg: T('Update '),
      job: T('Updating...')
    },

    rollback_dialog: {
      title: T('Roll Back'),
      version: {
        placeholder: T('Version'),
        tooltip: T('Enter the version to roll back to.'),
      },
      snapshot: {
        placeholder: T('Roll back snapshots'),
        tooltip: T('Roll back snapshots of ix_volumes')
      },
      force: {
        placeholder: T('Force'),
        tooltip: T('Used for rollback of a chart release and snapshots of ix_volumes')
      },
      action: T('Roll back'),

      msg: T('Roll back '),
      job: T('Rolling back...')
    }
  },

  chartForm: {
    title: T('New Chart Release'),
    editTitle: T('Edit Chart Release'),
    catalog: {
      placeholder: T('Catalog'),
      tooltip: T('')
    },
    item: {
      placeholder: T('Item'),
      tooltip: T('')
    },
    release_name: {
      placeholder: T('Release Name'),
      tooltip: T('')
    },
    train: {
      placeholder: T('Train'),
      tooltip: T('')
    },
    version: {
      placeholder: T('Version'),
      tooltip: T('')
    },
    repository: {
      placeholder: T('Image repository'),
      tooltip: T('')
    },
    container_port: {
      placeholder: T('Container port'),
      tooltip: T('')
    },
    node_port: {
      placeholder: T('Node port'),
      tooltip: T('The range of valid ports is 9000-65535.'),
      validation: [Validators.min(9000), Validators.max(65535)]
    },

    image: { 
      title: T('Image'),
      tag: {
        placeholder: T('Image Tag'),
        tooltip: T('Tag to use for the specified image')
      },
      repo: {
        placeholder: T('Image Repository'),
        tooltip: T('Docker image repository')
      },
      pullPolicy: {
        placeholder: T('Image Pull Policy'),
        tooltip: T('Docker image pull policy'),
        options: [
          {
            value: 'IfNotPresent',
            label: T('Only pull image if not present on host.')
          },
          {
            value: 'Always',
            label: T('Always pull image even if present on host.')
          },
          {
            value: 'Never',
            label: T('Never pull image even if it is not present on host.')
          }
        ]
      }
    },
    update: {
      title: T('Restart/Update'),
      placeholder: T('Update Strategy'),
      tooltip: T(''),
        options: [
          {
            value: 'RollingUpdate',
            label: T('Create new pods and then kill old ones.')
          },
          {
            value: 'Recreate',
            label: T('Kill existing pods before creating new ones.')
          }
        ]
    },
    restart: {
      placeholder: T('Restart Policy'),
      tooltip: T(''),
        options: [
          {
            value: 'Always',
            label: T('Always restart containers in a pod if they exit.')
          },
          {
            value: 'OnFailure',
            label: T('Only restart containers if they exit with a failure.')
          },
          {
            value: 'Never',
            label: T('Never restart containers if they exit.')
          }
        ]
    },
    container: {
      title: T('Container Entrypoint'),
      command: {
        placeholder: T('Container CMD'),
        tooltip: T('Commands to execute inside container overriding image CMD default. \
 Use <i>ENTER</i> after each entry.')
      },
      args: {
        placeholder: T('Container Args'),
        tooltip: T('Specify arguments for container command. Use <i>ENTER</i> after each entry.')
      },
      env_vars: {
        title: T('Container Environment Variables'),
        key: {
          placeholder: T('Environment Variable Name'),
          tooltip: T('')
        },
        value: {
          placeholder: T('Environment Variable Value'),
          tooltip: T('')
        }
      }
    },
    networking: T('Networking'),
    externalInterfaces: {
      title: T('Add External Interfaces'),
      host: {
        placeholder: T('Host Interface'),
        tooltip: T(''),
      },
      ipam: {
        placeholder: T('IP Address Management'),
        tooltip: T('Specify type for IPAM.'),
        options: [
          {
            value: 'dhcp',
            label: T('Use DHCP')
          },
          {
            value: 'static',
            label: T('Use static IP')
          }
        ]
      },
      staticConfig: {
        placeholder: T('Static IP'),
        tooltip: T('')
      },
      staticRoutes: {
        title: T('Static Route Configuration'),

        destination: {
          placeholder: T('Static Route: Destination'),
        },
        gateway: {
          placeholder: T('Static Route: Gateway')
        }
      }
    },
    DNSPolicy: {
      title: T('DNS'),
      placeholder: T('DNS Policy'),
      tooltip: T('Default behaviour is for pod to inherit the name resolution configuration \
 from the node that the pods run on. If <i>None</i> is specified, it allows a Pod to ignore DNS \
 settings from the Kubernetes environment.'),
      options: [
        {
          value: 'Default',
          label: T('Use Default DNS Policy')
        },
        {
          value: 'None',
          label: T('Ignore DNS settings from the Kuberentes cluster')
        }
      ]
    },
    DNSConfig: {
      label: T('DNS Configuration'),
      nameservers: {
        placeholder: T('Nameservers'),
        tooltip: T('Use <i>ENTER</i> after each entry.')
      },
      searches: {
        placeholder: T('Searches'),
        tooltip: T('Use <i>ENTER</i> after each entry.')
      }
    },
    hostNetwork: {
      title: T('Host Network/Host Ports'),
      placeholder: T('Host Network'),
      tooltip: T('Provide access to node network namespace for the workload.')
    },
    externalLabel: T('Add External Interfaces'),
    hostPortsList: {
      containerPort: {
        placeholder: T('Container Port'),
        validation: [
          Validators.pattern("^[0-9]*$"),
        ]
      },
      hostPort: {
        placeholder: T('Host Port'),
        
      }
    },
    portForwardingList: {
      title: T('Port Forwarding List'),
      containerPort: {
        placeholder: T('Container Port'),
        validation: [
          Validators.pattern("^[0-9]*$"),
        ]
      },
      nodePort: {
        placeholder: T('Node Port'),
        tooltip: T('The range of valid ports is 9000-65535.'),
        validation: [
          Validators.pattern("^[0-9]*$"),
          Validators.min(9000), Validators.max(65535)]
      },
      protocol: {
        placeholder: T('Protocol'),
        options: [
          {
            value: 'TCP',
            label: T('TCP Protocol')
          },
          {
            value: 'UDP',
            label: T('UDP Protocol')
          }
        ]
      }
    },
    hostPathVolumes: {
      title: T('Host Path Volumes'),
      hostPath: {
        placeholder: T('Host Path'),
        tooltip: T('')
      },
      mountPath: {
        placeholder: T('Mount Path'),
        tooltip: T('Path where host path will be mounted inside the pod')
      },
      readOnly: {
        placeholder: T('Read Only'),
      }
    },
    volumes: {
      title: T('Volumes'),
      mountPath: {
        placeholder: T('Mount Path'),
        tooltip: T('Path where the volume path will be mounted inside the pod')
      },
      datasetName: {
        placeholder: T('Dataset Name'),
        tooltip: T('')
      }
    },
    gpu: {
      title: T('GPU Configuration'),
      property: {
        placeholder: T('Property'),
        tooltip: T('')
      },
      value: {
        placeholder: T('Value')
      }

    }

  },
  wizardLabels: {
    image: T('Image and Policies'),
    container: T('Container Settings')
  },

  nextCloudForm: {
    title: T('Nextcloud'),
    release_name: {
      name: T('Name'),
    },
    config: {
      label: T('Configuration'),
      host: {
        placeholder: T('Nextcloud Host'),
        tooltip: T('Nextcloud host to create application URLs'),
      },
      username: T('Nextcloud Username'),
      password: T('Password'),
      nodeport: {
        placeholder: T('Nodeport'),
        tooltip: T('Node Port to use for Nextcloud')
      }
    },
    nextcloudPath: T('Data Hostpath Enabled'),
    nextCloudHP: T('Data Hostpath')

  },

  plexForm: {
    title: T('Plex'),
    release: {
      name: T('Name'),
    },
    settings: {
      label: T('Settings'),
      claimToken: {
        placeholder: T('Plex Claim Token')
      },
      advertiseIp: {
        placeholder: T('Advertise IP')
      },
      timezone: {
        placeholder: T('Timezone')
      },
      hostNetwork: {
        placeholder: T('Host Network')
      },
      extraEnvVars: {
        label: T('Extra Environment Variables')
      }
    },
    plexTCP: T('Plex Node Port'),
    transcode: {
      hostpathEnabled: T('Transcode Hostpath Enabled'),
      hostPath: T('Transcode Hostpath')
    },
    data: {
      hostpathEnabled: T('Data Hostpath Enabled'),
      hostPath: T('Data Hostpath')
    },
    config: {
      hostpathEnabled: T('Config Hostpath Enabled'),
      hostPath: T('Config Hostpath')
    },
  },
  minioForm: {
    title: T('Minio'),
    accessLabel: T('Access'),
    accessKey: {
      placeholder: T('Access Key'),
      tooltip: T('Minimum length: 5 characters. Maximum length: 20 characters'),
      validation: [Validators.min(5), Validators.max(20)]
    },
    secretKey: {
      placeholder: T('Secret Key'),
      tooltip: T('Minimum length: 8 characters. Maximum length: 40 characters'),
      validation: [Validators.min(8), Validators.max(40)]
    },
    environment: {
      label: T('Minio Image Environment'),
      name: T('Name'),
      value: T('Value')
    },
    nodePort: {
      label: T('Node Port'),
      placeholder: T('Node Port'),
      tooltip: T('Node Port to use for Minio')
    },
    hostPathEnabled: T('Minio HostPath Enabled'),
    hostPath: {
      placeholder: T('Host Path'),
      tooltip: T('Specify HostPath for Minio data')
    }
  },


  minioInfo: T('Minio: Kubernetes native, high performance object storage'),
  plexInfo: T('Plex: Media player, streaming service'),
  nextcloudInfo: T('Nextcloud:  a file sharing server that puts the control \
 and security of your own data back into your hands.'),

}
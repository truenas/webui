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
  }

}
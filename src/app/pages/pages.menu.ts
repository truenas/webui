export const PAGES_MENU = [
  {
    path: ['dashboard'],
    title: 'Dashboard',
    icon: 'ion-android-home',
    selected: false,
    expanded: false,
    order: 0
  },
  {
    title: 'System',
    icon: 'ion-android-options',
    selected: false,
    expanded: false,
    order: 0,
    children: [
      {
        path: ['system', 'general'],
        title: 'General',
        icon: 'ion-earth',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['system', 'advanced'],
        title: 'Advanced',
        icon: 'ion-ios-cog',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['system', 'email'],
        title: 'Email',
        icon: 'ion-email',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['system', 'update'],
        title: 'Update',
        icon: 'ion-arrow-up-a',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['system', 'certificates'],
        title: 'Certificates',
        icon: 'ion-ios-locked',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['system', 'ca'],
        title: 'CA',
        icon: 'ion-ios-locked',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['system', 'tunable'],
        title: 'Tunables',
        icon: 'ion-ios-locked',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['system', 'bootenv'],
        title: 'Boot Environments',
        icon: 'ion-beer',
        selected: false,
        expanded: false,
        order: 0
      }
    ]
  },
  {
    title: 'Accounts',
    icon: 'ion-person-stalker',
    selected: false,
    expanded: false,
    order: 0,
    children: [
      {
        path: ['users'],
        title: 'Users',
        icon: 'ion-person',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['groups'],
        title: 'Groups',
        icon: 'ion-person-stalker',
        selected: false,
        expanded: false,
        order: 0
      },
    ],
  },
  {
    title: 'Directory Service',
    icon: 'ion-ios-book',
    selected: false,
    expanded: false,
    order: 0,
    children: [
      {
        path: ['directoryservice', 'ldap'],
        title: 'LDAP',
        icon: 'ion-pizza',
        selected: false,
        expanded: false,
        order: 0
      }
    ]
  },
  {
    title: 'Network',
    icon: 'ion-network',
    selected: false,
    expanded: false,
    order: 0,
    children: [
      {
        path: ['network', 'configuration'],
        title: 'Configuration',
        icon: 'ion-settings',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['network', 'interfaces'],
        title: 'Interfaces',
        icon: 'ion-network',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['network', 'vlans'],
        title: 'Vlans',
        icon: 'ion-pull-request',
        selected: false,
        expanded: false,
        order: 0
      }
    ]
  },
  {
    path: ['storage'],
    title: 'Storage',
    icon: 'ion-cube',
    selected: false,
    expanded: false,
    order: 0,
    children: [
      {
        path: ['storage', 'volumes'],
        title: 'Volumes',
        icon: 'ion-cube',
        selected: false,
        expanded: false,
        order: 0,
      },
      {
        path: ['storage', 'snapshots'],
        title: 'Snapshots',
        icon: 'ion-network',
        selected: false,
        expanded: false,
        order: 0
      }, 
    ]
  },
  {
    title: 'Sharing',
    icon: 'ion-share',
    selected: false,
    expanded: false,
    order: 0,
    children: [
      {
        path: ['sharing', 'afp'],
        title: 'AFP',
        icon: 'ion-social-apple',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['sharing', 'nfs'],
        title: 'NFS',
        icon: 'ion-social-freebsd-devil',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['sharing', 'smb'],
        title: 'SMB',
        icon: 'ion-social-windows',
        selected: false,
        expanded: false,
        order: 0
      },
    ],
  },
  {
    path: ['services'],
    title: 'Services',
    icon: 'ion-gear-b',
    selected: false,
    expanded: false,
    order: 0
  },
  {
    title: 'Jails',
    icon: 'ion-social-freebsd-devil',
    selected: false,
    expanded: false,
    order: 0,
    children: [
      {
        path: ['jails', 'jails'],
        title: 'Instances',
        icon: 'ion-ios-list',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['jails', 'storage'],
        title: 'Storage',
        icon: 'ion-cloud',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['jails', 'templates'],
        title: 'Templates',
        icon: 'ion-ios-albums',
        selected: false,
        expanded: false,
        order: 0
      },
      {
        path: ['jails', 'configuration'],
        title: 'Configuration',
        icon: 'ion-settings',
        selected: false,
        expanded: false,
        order: 0
      }
    ],
  },
  {
    title: 'VM/Container',
    icon: 'ion-monitor',
    selected: false,
    expanded: false,
    order: 0,
    children: [
      {
        path: ['vm'],
        title: 'VMs',
        icon: 'ion-ios-monitor',
        selected: false,
        expanded: false,
        order: 0
      },
    ],
  },
];

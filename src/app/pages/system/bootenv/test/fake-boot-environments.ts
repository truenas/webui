import { Bootenv } from 'app/interfaces/bootenv.interface';

export const fakeBootEnvironmentsDataSource = [
  {
    id: 'CLONE',
    realname: 'CLONE',
    name: 'CLONE',
    active: '',
    activated: false,
    can_activate: true,
    mountpoint: '-',
    space: '384.0K',
    created: {
      $date: 1661185620000,
    },
    keep: false,
    rawspace: 393216,
  },
  {
    id: '22.12-MASTER-20220808-020013',
    realname: '22.12-MASTER-20220808-020013',
    name: '22.12-MASTER-20220808-020013',
    active: 'NR',
    activated: true,
    can_activate: true,
    mountpoint: 'legacy',
    space: '2.61G',
    created: {
      $date: 1660053120000,
    },
    keep: false,
    rawspace: 2797170688,
  },
] as Bootenv[];

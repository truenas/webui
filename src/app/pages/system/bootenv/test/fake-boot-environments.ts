import { BootEnvironment } from 'app/interfaces/boot-environment.interface';

export const fakeBootEnvironmentsDataSource = [
  {
    id: '25.04.0-MASTER-20241031-104807',
    dataset: 'boot-pool/ROOT/25.04.0-MASTER-20241031-104807',
    active: false,
    activated: false,
    created: {
      $date: 1730397347000,
    },
    used_bytes: 3272175616,
    used: '3.05 GiB',
    keep: false,
    can_activate: true,
  },
  {
    id: '25.04.0-MASTER-20241105-224807',
    dataset: 'boot-pool/ROOT/25.04.0-MASTER-20241105-224807',
    active: true,
    activated: true,
    created: {
      $date: 1730894736000,
    },
    used_bytes: 3357876224,
    used: '3.13 GiB',
    keep: false,
    can_activate: true,
  },
] as BootEnvironment[];

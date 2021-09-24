export type DatasetPermissionsUpdate = [
  path: string,
  update: {
    user: string;
    group: string;
    mode: string;
    acl: unknown[];
    options: {
      stripacl?: boolean;
      recursive?: boolean;
      traverse?: boolean;
    };
  },
];

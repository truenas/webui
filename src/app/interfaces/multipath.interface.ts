export interface Multipath {
  type: string;
  name: string;
  status: string;
  children: MultipathChild[];
}

export interface MultipathChild {
  type: string;
  name: string;
  status: string;
  lun_id: string;
}

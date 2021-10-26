export interface ListdirChild {
  name: string;
  acl?: boolean;
  hasChildren?: boolean;
  subTitle: string;
  children?: ListdirChild[];
}

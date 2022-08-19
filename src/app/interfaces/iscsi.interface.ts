import {
  IscsiAuthMethod, IscsiExtentRpm, IscsiExtentType, IscsiTargetMode,
} from 'app/enums/iscsi.enum';

export interface IscsiPortal {
  comment: string;
  discovery_authgroup: number;
  discovery_authmethod: IscsiAuthMethod;
  id: number;
  listen: IscsiInterface[];
  tag: number;
}

export type IscsiPortalUpdate = Omit<IscsiPortal, 'id' | 'tag'>;

export interface IscsiInterface {
  ip: string;
}

export interface IscsiInitiatorGroup {
  comment: string;
  id: number;
  initiators: string;
}

export type IscsiInitiatorGroupUpdate = Omit<IscsiInitiatorGroup, 'id'>;

export interface IscsiAuthAccess {
  id: number;
  peersecret: string;
  peeruser: string;
  secret: string;
  tag: number;
  user: string;
}

export type IscsiAuthAccessUpdate = Omit<IscsiAuthAccess, 'id'>;

export interface IscsiTarget {
  alias: string;
  groups: IscsiTargetGroup[];
  auth_networks: string[];
  id: number;
  mode: IscsiTargetMode;
  name: string;
}

export type IscsiTargetUpdate = Omit<IscsiTarget, 'id'>;

export interface IscsiTargetGroup {
  portal: number;
  initiator: number;
  auth: number;
  authmethod: IscsiAuthMethod;
}

export interface IscsiExtent {
  avail_threshold: number;
  blocksize: number;
  comment: string;
  disk: string;
  enabled: boolean;
  filesize: number;
  id: number;
  insecure_tpc: boolean;
  name: string;
  path: string;
  pblocksize: boolean;
  ro: boolean;
  rpm: IscsiExtentRpm;
  serial: string;
  type: IscsiExtentType;
  xen: boolean;
}

export type IscsiExtentUpdate = Omit<IscsiExtent, 'id'>;

export interface IscsiTargetExtent {
  extent: number;
  id: number;
  lunid: number;
  target: number;
}

export type IscsiTargetExtentUpdate = Omit<IscsiTargetExtent, 'id'>;

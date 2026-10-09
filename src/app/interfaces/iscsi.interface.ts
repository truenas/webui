import { CallParams } from '@truenas/api-client';
import {
  IscsiAuthMethod, IscsiExtentRpm, IscsiExtentType, IscsiTargetMode,
} from 'app/enums/iscsi.enum';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

export interface IscsiPortal {
  comment?: string;
  id: number;
  listen: IscsiInterface[];
  tag: number;
}

export type IscsiPortalUpdate = Omit<IscsiPortal, 'id' | 'tag'>;

export interface IscsiInterface {
  ip: string;
  port: number;
}

export interface IscsiInitiatorGroup {
  comment?: string;
  id: number;
  initiators?: string[];
}

export type IscsiInitiatorGroupUpdate = Partial<Omit<IscsiInitiatorGroup, 'id'>>;

export interface IscsiAuthAccess {
  id: number;
  peersecret?: string;
  peeruser?: string;
  secret: string;
  tag: number;
  user: string;
  discovery_auth?: IscsiAuthMethod;
}

export interface IscsiTarget {
  alias?: string;
  groups?: IscsiTargetGroup[];
  auth_networks?: string[];
  id: number;
  mode?: IscsiTargetMode;
  name: string;
}

export type IscsiTargetUpdate = Omit<IscsiTarget, 'id'>;

export interface IscsiTargetGroup {
  portal: number;
  initiator?: number | null;
  auth?: number | null;
  authmethod?: IscsiAuthMethod;
}

export interface IscsiExtent {
  avail_threshold?: number;
  blocksize?: number;
  comment?: string;
  disk?: string;
  enabled?: boolean;
  filesize?: number;
  id: number;
  insecure_tpc?: boolean;
  name: string;
  path?: string;
  pblocksize?: boolean;
  product_id?: string;
  ro?: boolean;
  rpm?: IscsiExtentRpm;
  serial?: string;
  type?: IscsiExtentType;
  xen?: boolean;
  naa: string;
}

export type IscsiExtentUpdate = Omit<IscsiExtent, 'id' | 'naa'>;

export interface IscsiTargetExtent {
  extent: number;
  id: number;
  lunid: number;
  target: number;
}

export type IscsiTargetExtentUpdate = Omit<IscsiTargetExtent, 'id'>;

export interface AssociatedTargetDialogData {
  target: IscsiTarget;
  extents: IscsiExtent[];
}

/**
 * Reads an `iscsi.target.query` row, or the entry `iscsi.target.create` / `update` return, into `IscsiTarget`.
 * Middleware spells `mode` and each group's `authmethod` as literals where the pages compare them with the UI's
 * enums; it describes the same object.
 */
export function toIscsiTarget(
  entry: WebUiQueryEntity<'iscsi.target.query'>,
): IscsiTarget {
  return entry as IscsiTarget;
}

/**
 * Reads an `iscsi.extent.query` row, or the entry `iscsi.extent.create` returns, into `IscsiExtent`. Middleware
 * types `type` and `rpm` as literals and `filesize` as a number or a string; the UI narrows them.
 */
export function toIscsiExtent(
  entry: WebUiQueryEntity<'iscsi.extent.query'>,
): IscsiExtent {
  return entry as IscsiExtent;
}

/** What `iscsi.extent.create` takes, as middleware declares it. */
export type IscsiExtentCreateArgs = CallParams<D, 'iscsi.extent.create'>[0];

/**
 * Hands an extent payload to `iscsi.extent.create` or `update` unchanged. Middleware narrows `blocksize` to the
 * sizes it accepts, which the form offers as plain numbers.
 */
export function toIscsiExtentCreateArgs(payload: IscsiExtentUpdate): IscsiExtentCreateArgs {
  return payload as IscsiExtentCreateArgs;
}

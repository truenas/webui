export interface PoolAttachment {
  attachments: string[];
  service: string;
  type: string;
}

export type DatasetAttachment = PoolAttachment;
export type ZvolAttachment = PoolAttachment;

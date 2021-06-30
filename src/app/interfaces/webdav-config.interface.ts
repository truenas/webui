export interface WebdavConfig {
  certssl: any;
  htauth: string;
  id: number;
  password: string;
  protocol: string;
  tcpport: number;
  tcpportssl: number;
}

export type WebdavConfigUpdate = Omit<WebdavConfig, 'id'>;

export interface WebdavConfig {
  certssl: number;
  htauth: string;
  id: number;
  password: string;
  protocol: string;
  tcpport: number;
  tcpportssl: number;
}

export type WebdavConfigUpdate = Omit<WebdavConfig, 'id'>;

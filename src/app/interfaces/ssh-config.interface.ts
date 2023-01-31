import { SshSftpLogFacility, SshSftpLogLevel, SshWeakCipher } from 'app/enums/ssh.enum';

export interface SshConfig {
  bindiface: string[];
  compression: boolean;
  host_dsa_key: string;
  host_dsa_key_cert_pub: string;
  host_dsa_key_pub: string;
  host_ecdsa_key: string;
  host_ecdsa_key_cert_pub: string;
  host_ecdsa_key_pub: string;
  host_ed25519_key: string;
  host_ed25519_key_cert_pub: string;
  host_ed25519_key_pub: string;
  host_key: string;
  host_key_pub: string;
  host_rsa_key: string;
  host_rsa_key_cert_pub: string;
  host_rsa_key_pub: string;
  id: number;
  kerberosauth: boolean;
  options: string;
  passwordauth: boolean;
  privatekey: string;
  rootlogin: boolean;
  adminlogin: boolean;
  sftp_log_facility: SshSftpLogFacility;
  sftp_log_level: SshSftpLogLevel;
  tcpfwd: boolean;
  tcpport: number;
  weak_ciphers: SshWeakCipher[];
}

export interface SshConfigUpdate {
  bindiface: string[];
  compression: boolean;
  kerberosauth: boolean;
  options: string;
  passwordauth: boolean;
  rootlogin: boolean;
  sftp_log_facility: SshSftpLogFacility;
  sftp_log_level: SshSftpLogLevel;
  tcpfwd: boolean;
  tcpport: number;
  weak_ciphers: SshWeakCipher[];
}

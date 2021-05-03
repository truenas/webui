import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user';

export type ApiDirectory = {
  // Active Directory
  'activedirectory.config': { params: any; response: any };
  'activedirectory.update': { params: any; response: any };
  'activedirectory.nss_info_choices': { params: any; response: any };

  // AFP
  'afp.bindip_choices': { params: any; response: any };

  // Acme
  'acme.dns.authenticator.query': { params: any; response: any };
  'acme.dns.authenticator.authenticator_schemas': { params: any; response: any };

  // Alert
  'alert.list': { params: any; response: any };
  'alert.dismiss': { params: any; response: any };
  'alert.restore': { params: any; response: any };
  'alert.list_policies': { params: any; response: any };
  'alert.list_categories': { params: any; response: any };

  // Alert Classes
  'alertclasses.config': { params: any; response: any };
  'alertclasses.update': { params: any; response: any };

  // Alert Service
  'alertservice.update': { params: any; response: any };
  'alertservice.create': { params: any; response: any };
  'alertservice.query': { params: any; response: any };
  'alertservice.test': { params: any; response: any };

  // Auth
  'auth.generate_token': { params: any; response: any };
  'auth.check_user': { params: any; response: any };
  'auth.login': { params: any; response: any };
  'auth.token': { params: any; response: any };
  'auth.logout': { params: any; response: any };
  'auth.twofactor.update': { params: any; response: any };
  'auth.twofactor.provisioning_uri': { params: any; response: any };
  'auth.two_factor_auth': { params: any; response: any };
  'auth.twofactor.renew_secret': { params: any; response: any };
  'auth.twofactor.config': { params: any; response: any };

  // Boot
  'boot.set_scrub_interval': { params: any; response: any };
  'boot.replace': { params: any; response: any };
  'boot.get_state': { params: any; response: any };
  'boot.detach': { params: any; response: any };

  // Bootenv
  'bootenv.create': { params: any; response: any };
  'bootenv.update': { params: any; response: any };
  'bootenv.set_attribute': { params: any; response: any };
  'bootenv.activate': { params: any; response: any };
  'bootenv.delete': { params: any; response: any };
  'bootenv.query': { params: any; response: any };
  'boot.scrub': { params: any; response: any };

  // Catalog
  'catalog.query': { params: any; response: any };
  'catalog.items': { params: any; response: any };
  'catalog.sync': { params: any; response: any };

  // Certificate
  'certificate.create': { params: any; response: any };
  'certificate.query': { params: any; response: any };
  'certificate.ec_curve_choices': { params: any; response: any };
  'certificate.country_choices': { params: any; response: any };
  'certificate.extended_key_usage_choices': { params: any; response: any };
  'certificate.profiles': { params: any; response: any };
  'certificate.acme_server_choices': { params: any; response: any };
  'certificate.get_domain_names': { params: any; response: any };

  // Certificate Authority
  'certificateauthority.create': { params: any; response: any };
  'certificateauthority.query': { params: any; response: any };
  'certificateauthority.update': { params: any; response: any };
  'certificateauthority.profiles': { params: any; response: any };

  // Chart
  'chart.release.pod_logs_choices': { params: any; response: any };
  'chart.release.query': { params: any; response: any };
  'chart.release.scale': { params: any; response: any };
  'chart.release.pod_console_choices': { params: any; response: any };
  'chart.release.nic_choices': { params: any; response: any };
  'chart.release.events': { params: any; response: any };

  // CRON
  'cronjob.run': { params: any; response: any };

  // Core
  'core.download': { params: any; response: any };
  'core.get_jobs': { params: any; response: any };
  'core.job_abort': { params: any; response: any };
  'core.bulk': { params: any; response: any };
  'core.resize_shell': { params: any; response: any };

  // Cloudsync
  'cloudsync.providers': { params: any; response: any };
  'cloudsync.credentials.query': { params: any; response: any };
  'cloudsync.credentials.verify': { params: any; response: any };
  'cloudsync.onedrive_list_drives': { params: any; response: any };
  'cloudsync.list_buckets': { params: any; response: any };
  'cloudsync.list_directory': { params: any; response: any };
  'cloudsync.update': { params: any; response: any };
  'cloudsync.create': { params: any; response: any };
  'cloudsync.sync': { params: any; response: any };
  'cloudsync.abort': { params: any; response: any };
  'cloudsync.restore': { params: any; response: any };
  'cloudsync.query': { params: any; response: any };
  'cloudsync.delete': { params: any; response: any };

  // Container
  'container.config': { params: any; response: any };
  'container.update': { params: any; response: any };

  // Docker
  'docker.images.query': { params: any; response: any };

  // DynDNS
  'dyndns.provider_choices': { params: any; response: any };

  // Datastore
  'datastore.delete': { params: any; response: any };

  // Disk
  'disk.query': { params: any; response: any };
  'disk.get_unused': { params: any; response: any };
  'disk.get_encrypted': { params: any; response: any };
  'disk.temperatures': { params: any; response: any };

  // Directory Services
  'directoryservices.cache_refresh': { params: any; response: any };
  'directoryservices.get_state': { params: any; response: any };

  // Filesystem
  'filesystem.acl_is_trivial': { params: any; response: any };
  'filesystem.listdir': { params: any; response: any };
  'filesystem.stat': { params: any; response: any };
  'filesystem.default_acl_choices': { params: any; response: any };
  'filesystem.get_default_acl': { params: any; response: any };
  'filesystem.statfs': { params: any; response: any };
  'filesystem.getacl': { params: any; response: any };

  // Failover
  'failover.licensed': { params: any; response: any };
  'failover.upgrade_pending': { params: any; response: any };
  'failover.sync_from_peer': { params: any; response: any };
  'failover.status': { params: any; response: any };
  'failover.update': { params: any; response: any };
  'failover.force_master': { params: any; response: any };
  'failover.call_remote': { params: any; response: any };
  'failover.get_ips': { params: any; response: string[] };
  'failover.node': { params: any; response: any };
  'failover.disabled_reasons': { params: void; response: FailoverDisabledReason[] };

  // FCPort
  'fcport.update': { params: any; response: any };

  // DS Cache
  'dscache.get_uncached_group': { params: any; response: any };
  'dscache.get_uncached_user': { params: any; response: any };

  // Keychain Credential
  'keychaincredential.create': { params: any; response: any };
  'keychaincredential.query': { params: any; response: any };
  'keychaincredential.generate_ssh_key_pair': { params: any; response: any };
  'keychaincredential.remote_ssh_host_key_scan': { params: any; response: any };
  'keychaincredential.delete': { params: any; response: any };
  'keychaincredential.remote_ssh_semiautomatic_setup': { params: any; response: any };

  // Kubernetes
  'kubernetes.config': { params: any; response: any };
  'kubernetes.bindip_choices': { params: any; response: any };

  // Multipath
  'multipath.query': { params: any; response: any };

  // Mail
  'mail.config': { params: any; response: any };
  'mail.update': { params: any; response: any };

  // idmap
  'idmap.backend_options': { params: any; response: any };

  // Interface
  'interface.websocket_local_ip': { params: any; response: any };
  'interface.commit': { params: any; response: any };
  'interface.services_restarted_on_sync': { params: any; response: any };
  'interface.rollback': { params: any; response: any };
  'interface.bridge_members_choices': { params: any; response: any };
  'interface.lag_supported_protocols': { params: any; response: any };
  'interface.lag_ports_choices': { params: any; response: any };
  'interface.vlan_parent_interface_choices': { params: any; response: any };
  'interface.query': { params: any; response: any };
  'interface.has_pending_changes': { params: any; response: any };
  'interface.checkin_waiting': { params: any; response: any };
  'interface.checkin': { params: any; response: any };

  // iSCSI
  'iscsi.portal.listen_ip_choices': { params: any; response: any };
  'iscsi.portal.query': { params: any; response: any };
  'iscsi.initiator.query': { params: any; response: any };
  'iscsi.target.query': { params: any; response: any };
  'iscsi.extent.disk_choices': { params: any; response: any };
  'iscsi.extent.query': { params: any; response: any };
  'iscsi.auth.query': { params: any; response: any };
  'iscsi.global.sessions': { params: any; response: any };
  'iscsi.targetextent.create': { params: any; response: any };
  'iscsi.targetextent.query': { params: any; response: any };
  'iscsi.targetextent.update': { params: any; response: any };
  'iscsi.auth.update': { params: any; response: any };
  'iscsi.auth.create': { params: any; response: any };
  'iscsi.extent.create': { params: any; response: any };
  'iscsi.extent.update': { params: any; response: any };
  'iscsi.initiator.create': { params: any; response: any };
  'iscsi.initiator.update': { params: any; response: any };
  'iscsi.portal.create': { params: any; response: any };
  'iscsi.portal.update': { params: any; response: any };
  'iscsi.target.update': { params: any; response: any };
  'iscsi.target.create': { params: any; response: any };

  // IPMI
  'ipmi.is_loaded': { params: any; response: any };
  'ipmi.identify': { params: any; response: any };
  'ipmi.update': { params: any; response: any };
  'ipmi.query': { params: any; response: any };

  // Group
  'group.query': { params: any; response: any };
  'group.update': { params: any; response: any };
  'group.delete': { params: any; response: any };
  'group.get_group_obj': { params: any; response: any };
  'group.get_next_gid': { params: any; response: any };

  // Jail
  'jail.query': { params: any; response: any };
  'jail.create': { params: any; response: any };
  'jail.delete': { params: any; response: any };
  'jail.get_activated_pool': { params: any; response: any };
  'jail.activate': { params: any; response: any };
  'jail.update': { params: any; response: any };
  'jail.upgrade': { params: any; response: any };
  'jail.releases_choices': { params: any; response: any };
  'jail.get_version': { params: any; response: any };
  'jail.interface_choices': { params: any; response: any };
  'jail.default_configuration': { params: any; response: any };
  'jail.fstab': { params: any; response: any };

  // Notifier
  'notifier.choices': { params: any; response: any };

  // Network
  'network.configuration.activity_choices': { params: any; response: any };
  'network.configuration.update': { params: any; response: any };
  'network.general.summary': { params: any; response: any };
  'network.configuration.config': { params: any; response: any };

  // Kerberos
  'kerberos.realm.query': { params: any; response: any };
  'kerberos.keytab.has_nfs_principal': { params: any; response: any };
  'kerberos.config': { params: any; response: any };
  'kerberos.keytab.kerberos_principal_choices': { params: any; response: any };

  'kmip.update': { params: any; response: any };
  'kmip.config': { params: any; response: any };
  'kmip.kmip_sync_pending': { params: any; response: any };
  'kmip.sync_keys': { params: any; response: any };
  'kmip.clear_sync_pending_keys': { params: any; response: any };

  // Ldap
  'ldap.ssl_choices': { params: any; response: any };
  'ldap.update': { params: any; response: any };
  'ldap.schema_choices': { params: any; response: any };
  'ldap.config': { params: any; response: any };

  // LLDP
  'lldp.country_choices': { params: any; response: any };
  'lldp.update': { params: any; response: any };

  // NIS
  'nis.update': { params: any; response: any };
  'nis.config': { params: any; response: any };

  // NFS
  'nfs.bindip_choices': { params: any; response: any };
  'nfs.config': { params: any; response: any };
  'nfs.update': { params: any; response: any };

  // OpenVPN
  'openvpn.client.update': { params: any; response: any };
  'openvpn.client.authentication_algorithm_choices': { params: any; response: any };
  'openvpn.client.cipher_choices': { params: any; response: any };
  'openvpn.server.renew_static_key': { params: any; response: any };
  'openvpn.client.config': { params: any; response: any };
  'openvpn.server.cipher_choices': { params: any; response: any };
  'openvpn.server.authentication_algorithm_choices': { params: any; response: any };
  'openvpn.server.client_configuration_generation': { params: any; response: any };
  'openvpn.server.update': { params: any; response: any };

  // Plugin
  'plugin.defaults': { params: any; response: any };
  'plugin.update': { params: any; response: any };
  'plugin.query': { params: any; response: any };
  'plugin.official_repositories': { params: any; response: any };

  // Pool
  'pool.query': { params: any; response: any };
  'pool.update': { params: any; response: any };
  'pool.create': { params: any; response: any };
  'pool.dataset.path_in_locked_datasets': { params: any; response: any };
  'pool.filesystem_choices': { params: any; response: any };
  'pool.dataset.set_quota': { params: any; response: any };
  'pool.dataset.recommended_zvol_blocksize': { params: any; response: any };
  'pool.unlock_services_restart_choices': { params: any; response: any };
  'pool.dataset.get_quota': { params: any; response: any };
  'pool.snapshottask.query': { params: any; response: any };
  'pool.import_disk_autodetect_fs_type': { params: any; response: any };
  'pool.download_encryption_key': { params: any; response: any };
  'pool.snapshottask.create': { params: any; response: any };
  'pool.snapshottask.update': { params: any; response: any };
  'pool.import_disk_msdosfs_locales': { params: any; response: any };
  'pool.snapshottask.delete': { params: any; response: any };
  'pool.dataset.query': { params: any; response: any[] };
  'pool.scrub.delete': { params: any; response: any };
  'pool.scrub.query': { params: any; response: any };
  'pool.dataset.compression_choices': { params: any; response: any };
  'pool.dataset.encryption_algorithm_choices': { params: any; response: any };
  'pool.offline': { params: any; response: any };
  'pool.online': { params: any; response: any };
  'pool.remove': { params: any; response: any };
  'pool.detach': { params: any; response: any };
  'pool.passphrase': { params: any; response: any };
  'pool.rekey': { params: any; response: any };
  'pool.attachments': { params: any; response: any };
  'pool.recoverykey_rm': { params: any; response: any };
  'pool.processes': { params: any; response: any };
  'pool.scrub': { params: any; response: any };
  'pool.dataset.query_encrypted_roots_keys': { params: any; response: any };
  'pool.upgrade': { params: any; response: any };
  'pool.dataset.delete': { params: any; response: any };
  'pool.dataset.promote': { params: any; response: any };
  'pool.dataset.update': { params: any; response: any };
  'pool.dataset.create': { params: any; response: any };
  'pool.is_upgraded': { params: any; response: any };

  // Replication
  'replication.list_datasets': { params: any; response: any };
  'replication.create': { params: any; response: any };
  'replication.query': { params: any; response: any };
  'replication.restore': { params: any; response: any };
  'replication.run': { params: any; response: any };
  'replication.delete': { params: any; response: any };
  'replication.count_eligible_manual_snapshots': { params: any; response: any };
  'replication.list_naming_schemas': { params: any; response: any };
  'replication.target_unmatched_snapshots': { params: any; response: any };
  'replication.update': { params: any; response: any };

  // Rsync
  'rsynctask.run': { params: any; response: any };
  'rsynctask.query': { params: any; response: any };
  'rsynctask.delete': { params: any; response: any };

  // Rsyncd
  'rsyncd.update': { params: any; response: any };

  // Rsyncmod
  'rsyncmod.query': { params: any; response: any };
  'rsyncmod.update': { params: any; response: any };

  // Reporting
  'reporting.get_data': { params: any; response: any };
  'reporting.update': { params: any; response: any };

  // S3
  's3.bindip_choices': { params: any; response: any };

  // SMB
  'smb.bindip_choices': { params: any; response: any };
  'smb.unixcharset_choices': { params: any; response: any };
  'smb.get_smb_ha_mode': { params: any; response: any };
  'smb.update': { params: any; response: any };
  'smb.sharesec.query': { params: any; response: any };

  // SSH
  'ssh.update': { params: any; response: any };
  'ssh.bindiface_choices': { params: any; response: any };

  // System
  'system.feature_enabled': { params: any; response: any };
  'system.advanced.update': { params: any; response: any };
  'system.reboot': { params: any; response: any };
  'system.shutdown': { params: any; response: any };
  'system.advanced.serial_port_choices': { params: any; response: any };
  'system.info': { params: any; response: any };
  'system.advanced.config': { params: any; response: any };
  'system.general.update': { params: any; response: any };
  'system.ntpserver.delete': { params: any; response: any };
  'system.ntpserver.query': { params: any; response: any };
  'system.general.config': { params: any; response: any };
  'system.general.kbdmap_choices': { params: any; response: any };
  'system.general.language_choices': { params: any; response: any };
  'system.general.timezone_choices': { params: any; response: any };
  'system.general.ui_address_choices': { params: any; response: any };
  'system.license_update': { params: any; response: any };
  'system.general.ui_v6address_choices': { params: any; response: any };
  'system.build_time': { params: any; response: any };
  'system.product_type': { params: void; response: ProductType };

  // Support
  'support.is_available': { params: any; response: any };
  'support.is_available_and_enabled': { params: any; response: any };
  'support.config': { params: any; response: any };
  'support.update': { params: any; response: any };

  // SMART
  'smart.test.disk_choices': { params: any; response: any };
  'smart.update': { params: any; response: any };
  'smart.test.manual_test': { params: any; response: any };

  // SystemDataset
  'systemdataset.pool_choices': { params: any; response: any };
  'systemdataset.config': { params: any; response: any };

  // Service
  'service.started': { params: any; response: any };
  'service.query': { params: any; response: any };
  'service.update': { params: any; response: any };
  'service.start': { params: any; response: any };
  'service.stop': { params: any; response: any };
  'service.restart': { params: any; response: any };

  // Sharing
  'sharing.smb.query': { params: any; response: any[] };
  'sharing.smb.presets': { params: any; response: any[] };
  'sharing.afp.query': { params: any; response: any };

  // Tunable
  'tunable.tunable_type_choices': { params: any; response: any };

  // TFTP
  'tftp.update': { params: any; response: any };

  // Truecommand
  'truecommand.config': { params: any; response: any };
  'truecommand.update': { params: any; response: any };
  'truecommand.connected': { params: any; response: any };

  // TrueNAS
  'truenas.is_eula_accepted': { params: any; response: any };
  'truenas.get_eula': { params: any; response: any };
  'truenas.accept_eula': { params: any; response: any };
  'truenas.is_production': { params: any; response: any };
  'truenas.set_production': { params: any; response: any };

  // Vm
  'vm.query': { params: any; response: any };
  'vm.cpu_model_choices': { params: any; response: any };
  'vm.bootloader_options': { params: any; response: any };
  'vm.device.nic_attach_choices': { params: any; response: any };
  'vm.device.bind_choices': { params: any; response: any };
  'vm.create': { params: any; response: any };
  'vm.delete': { params: any; response: any };
  'vm.resolution_choices': { params: any; response: any };
  'vm.get_display_web_uri': { params: any; response: any };
  'vm.device.passthrough_device_choices': { params: any; response: any };
  'vm.device.create': { params: any; response: any };
  'vm.random_mac': { params: any; response: any };
  'vm.device.query': { params: any; response: any };
  'vm.stop': { params: any; response: any };
  'vm.maximum_supported_vcpus': { params: any; response: any };
  'vm.device.update': { params: any; response: any };
  'vm.port_wizard': { params: any; response: any };
  'vm.get_available_memory': { params: any; response: any };
  'vm.clone': { params: any; response: any };
  'vm.update': { params: any; response: any };
  'vm.poweroff': { params: any; response: any };
  'vm.restart': { params: any; response: any };
  'vm.get_display_devices': { params: any; response: any };
  'vm.start': { params: any; response: any };

  // Vmware
  'vmware.dataset_has_vms': { params: any; response: any };
  'vmware.query': { params: any; response: any };
  'vmware.create': { params: any; response: any };
  'vmware.update': { params: any; response: any };

  // User
  'user.update': { params: any; response: any };
  'user.query': { params: QueryParams<User>; response: User[] };
  'user.set_root_password': { params: any; response: any };
  'user.delete': { params: any; response: any };
  'user.get_user_obj': { params: any; response: any };
  'user.shell_choices': { params: any; response: any };
  'user.set_attribute': { params: any; response: any };
  'user.get_next_uid': { params: any; response: any };
  'user.has_root_password': { params: any; response: any };

  // UPS
  'ups.update': { params: any; response: any };
  'ups.driver_choices': { params: any; response: any };
  'ups.port_choices': { params: any; response: any };

  // Update
  'update.get_auto_download': { params: any; response: any };
  'update.get_trains': { params: any; response: any };
  'update.set_auto_download': { params: any; response: any };
  'update.get_pending': { params: any; response: any };
  'update.check_available': { params: any; response: any };
  'update.set_train': { params: any; response: any };

  // ZFS
  'zfs.snapshot.create': { params: any; response: any };
  'zfs.dataset.query': { params: any; response: any };
  'zfs.snapshot.query': { params: any; response: any };
  'zfs.snapshot.delete': { params: any; response: any };
};

/**
 * Prefer typing like this:
 * ```
 * queryCall: 'user.query' = 'user.query'
 * ```
 * instead of using ApiMethod.
 */
export type ApiMethod = keyof ApiDirectory;

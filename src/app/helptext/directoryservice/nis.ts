import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';

export default {
nis_label: T('Network Information Service (NIS)'),
nis_custactions_clearcache_id: 'ds_clearcache',
nis_custactions_clearcache_name: T('Rebuild Directory Service Cache'),
nis_custactions_clearcache_dialog_title: T("NIS"),
nis_custactions_clearcache_dialog_message: T("The cache is being rebuilt."),
  
nis_domain_placeholder : T('NIS domain'),
nis_domain_tooltip: T('Name of NIS domain.'),
nis_domain_validation : [ Validators.required ],

nis_servers_placeholder : T('NIS servers'),
nis_servers_tooltip : T('Enter a comma-delimited list of hostnames or IP addresses.'),

nis_secure_mode_placeholder : T('Secure mode'),
nis_secure_mode_tooltip : T('Set to have <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=ypbind"\
 target="_blank">ypbind(8)</a> refuse to bind to any NIS\
 server not running as root on a TCP port over 1024.'),

nis_manycast_placeholder : T('Manycast'),
nis_manycast_tooltip : T('Set for ypbind to bind to the server that responds\
 the fastest.'),

nis_enable_placeholder : T('Enable'),
nis_enable_tooltip : T('Unset to disable the configuration without deleting it.')
}
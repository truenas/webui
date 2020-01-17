import { T } from '../../translate-marker';

export default {
ks_label: T('Kerberos Settings'),
ks_appdefaults_name: 'appdefaults_aux',
ks_appdefaults_placeholder: T('Appdefaults Auxiliary Parameters'),
ks_appdefaults_tooltip: T('Define any additional settings for use by some Kerberos\
 applications. The available settings and syntax is listed in the <a\
 href="https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html#appdefaults"\
 target="_blank">appdefaults section of krb.conf(5).</a>.'),

ks_libdefaults_name: 'libdefaults_aux',
ks_libdefaults_placeholder: T('Libdefaults Auxiliary Parameters'),
ks_libdefaults_tooltip: T('Define any settings used by the Kerberos library. The\
 available settings and their syntax are listed in the\
 <a href="https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html#libdefaults"\
 target="_blank">libdefaults section of krb.conf(5).</a>.')
}
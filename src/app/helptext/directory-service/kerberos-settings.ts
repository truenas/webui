import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  ks_label: T('Kerberos Settings'),
  ks_appdefaults_name: 'appdefaults_aux',
  ks_appdefaults_placeholder: T('Appdefaults Auxiliary Parameters'),
  ks_appdefaults_tooltip: T('Additional Kerberos application settings.\
 See the "appdefaults" section of\
 <a href="https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html" target="_blank">[krb.conf(5)]</a>.\
 for available settings and usage syntax.'),

  ks_libdefaults_name: 'libdefaults_aux',
  ks_libdefaults_placeholder: T('Libdefaults Auxiliary Parameters'),
  ks_libdefaults_tooltip: T('Additional Kerberos library settings.\
 See the "libdefaults" section of\
 <a href="https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html" target="_blank">[krb.conf(5)]</a>.\
 for available settings and usage syntax.'),
};

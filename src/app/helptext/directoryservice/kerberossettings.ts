import { T } from '../../translate-marker';

export default {
ks_label: T('Kerberos Settings'),
ks_appdefaults_name: 'appdefaults_aux',
ks_appdefaults_placeholder: T('Appdefaults Auxiliary Parameters'),
ks_appdefaults_tooltip: T('Additional Kerberos application settings.\
 See the "appdefaults" section of\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=krb5.conf&apropos=0&sektion=5&manpath=FreeBSD+12.0-RELEASE&arch=default&format=html" target="_blank">[krb.conf(5)]</a>.\
 for available settings and usage syntax.'),

ks_libdefaults_name: 'libdefaults_aux',
ks_libdefaults_placeholder: T('Libdefaults Auxiliary Parameters'),
ks_libdefaults_tooltip: T('Additional Kerberos library settings.\
 See the "libdefaults" section of\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=krb5.conf&apropos=0&sektion=5&manpath=FreeBSD+12.0-RELEASE&arch=default&format=html" target="_blank">[krb.conf(5)]</a>.\
 for available settings and usage syntax.')
}
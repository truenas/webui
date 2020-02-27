import { T } from '../../translate-marker';

export default {
ks_label: T('Kerberos Settings'),
ks_appdefaults_name: 'appdefaults_aux',
ks_appdefaults_placeholder: T('Appdefaults Auxiliary Parameters'),
ks_appdefaults_tooltip: T('Define any additional settings for use by some Kerberos\
 applications. The available settings and syntax is listed in the \
 <a href="https://www.freebsd.org/cgi/man.cgi?query=krb5.conf&apropos=0&sektion=5&manpath=FreeBSD+12.0-RELEASE&arch=default&format=html" target="_blank">appdefaults section of krb.conf(5)</a>.'),

ks_libdefaults_name: 'libdefaults_aux',
ks_libdefaults_placeholder: T('Libdefaults Auxiliary Parameters'),
ks_libdefaults_tooltip: T('Define any settings used by the Kerberos library. The\
 available settings and their syntax are listed in the\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=krb5.conf&apropos=0&sektion=5&manpath=FreeBSD+12.0-RELEASE&arch=default&format=html" target="_blank">libdefaults section of krb.conf(5)</a>.')
}
import { T } from '../../../translate-marker';

export default {
    step1_label: T('SSH Keypair/Connection'),

    transport_placeholder: T('Transport'),
    transport_tooltip: T('Method for snapshot transfer:<ul>\
 <li><i>SSH</i> is supported by most systems. It requires a previously created\
 <a href="%%docurl%%/system.html#ssh-connection" target="_blank">SSH connection</a>.</li>\
 <li><i>SSH+NETCAT</i> uses SSH to establish a connection to the remote system, then uses\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=nc" target="_blank">nc(1)</a> to send an unencrypted\
 data stream for higher transfer speeds. This is only an option when\
 replicating to a FreeBSD system that has <a href="https://github.com/freenas/py-libzfs"\
 target="_blank">py-libzfs</a> installed.</li>\
 <li><i>LOCAL</i> replicates snapshots to another dataset on the same system.</li>\
 <li><i>LEGACY</i> uses the legacy replication engine from FreeNAS 11.2 and earlier.</li></ul>'),
}
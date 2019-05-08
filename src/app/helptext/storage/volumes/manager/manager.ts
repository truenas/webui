import {Validators} from '@angular/forms';
import { T } from '../../../../translate-marker';

export default {
manager_needsDiskMessage : T("Add one or more disks to be used for data."),
manager_extendedNeedsDiskMessage : T("Add one or more disks to extend the pool."),
manager_sizeMessage : T("Estimated total raw data capacity"),
manager_extendedSizeMessage : T("Estimated data capacity available after extension."),
manager_disknumErrorMessage : T("WARNING: Adding data vdevs with different numbers of\
 disks is not recommended."),
manager_disknumErrorConfirmMessage : T("It is not recommended to create a pool with vdevs\
 containing different numbers of disks. Continue?"),
manager_disknumExtendConfirmMessage : T("It is not recommended to extend a pool with one or\
 more vdevs containing different numbers of disks. Continue?"),
manager_vdevtypeErrorMessage : T("Adding data vdevs of different types is not supported."),
manager_diskAddWarning : T("The contents of all added disks will be erased."),
manager_diskExtendWarning : T("Added disks are erased, then the pool is extended onto\
 the new disks with the chosen topology. Existing data on the pool is kept intact."),
manager_name_tooltip : T('ZFS pools must conform to strict naming <a\
 href="https://docs.oracle.com/cd/E23824_01/html/821-1448/gbcpt.html"\
 target="_blank">conventions</a>. Choose a\
 memorable name.'),
manager_encryption_tooltip : T('<a href="https://www.freebsd.org/cgi/man.cgi?query=geli&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">GELI</a> encryption is\
 available for ZFS pools. <b>WARNING:</b>\
 Read the <a\
 href="%%docurl%%/storage.html#managing-encrypted-pools"\
 target="_blank">Encryption section</a>\
 of the guide before activating this option.'),
manager_suggested_layout_tooltip : T('Create a recommended formation\
 of vdevs in a pool.'),

manager_encryption_message : T("Always back up the key! Losing the key\
 will also lose all data on the disks with\
 no chance of recovery."),

manager_extend_warning : "Extending the pool adds new\
 vdevs in a stripe with the\
 existing vdevs. It is important\
 to only use new vdevs of the\
 same size and type as those\
 already in the pool. This\
 operation cannot be reversed.\
 Continue?"

}
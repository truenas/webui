import { T } from '../../translate-marker';

export default {
    memory_dialog: {
        title: T("ERROR: Not Enough Memory"),
        message: T("The VM could not start because the current configuration could potentially\
 require more RAM than is available on the system.  Would you like to overcommit memory? "),
        buttonMsg: T("PROCEED"),
        secondaryCheckBoxMsg: T('Yes I understand the risks'),
        tooltip: T("Memory overcommitment allows multiple VMs to be launched when there is\
 not enough free memory for configured RAM of all VMs. Use with caution."),
    }
}
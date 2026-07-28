import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextVmList = {
  memory_dialog: {
    title: T('ERROR: Not Enough Memory'),
    message: T('The VM could not start because the current configuration could potentially\
 require more RAM than is available on the system. Memory overcommitment allows multiple VMs to be launched when there is\
 not enough free memory for configured RAM of all VMs. Use with caution. Would you like to overcommit memory?'),
    buttonMessage: T('Proceed'),
    secondaryCheckboxMessage: T('Yes I understand the risks'),
  },

  delete_dialog: {
    zvolsTooltip: T('Set to remove the data associated with this\
 Virtual Machine (which will result in data loss if the data is not backed up). Unset to\
 leave the data intact.'),
    forceTooltip: T('Set to ignore the Virtual\
 Machine status during the delete operation. Unset to prevent deleting\
 the Virtual Machine when it is still active or has an undefined state.'),
    devicesListHeader: T('The following disks will be deleted:'),
  },

  reset_dialog: {
    title: T('Reset Virtual Machine'),
    message: T('Resetting {vmName} is the equivalent of pressing the reset button on a physical machine. The guest OS\
 will not be shut down cleanly, which may result in data loss or filesystem corruption. Are you sure you want to\
 continue?'),
    buttonMessage: T('Reset'),
    successMessage: T('VM {vmName} has been reset.'),
  },

  stop_dialog: {
    forceTooltip: T('Force the VM to stop if it has not already\
 stopped within the specified shutdown timeout. Without this option selected, the VM will\
 receive the shutdown signal, but may or may not complete the shutdown process.'),
    successMessage: T('If {vmName} is still running, the Guest OS did not respond as expected. It is possible to use <i>Power Off</i> or the <i>Force Stop After Timeout</i> option to stop the VM.'),
  },
};

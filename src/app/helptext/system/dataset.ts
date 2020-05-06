import { T } from "app/translate-marker";

export const helptext_system_dataset = {
  metadata:{
    fieldsets:[T('Configure System Dataset')]
  },
  pool: {
    placeholder: T("System Dataset Pool"),
    tooltip: T("Select the pool to contain the system dataset.")
  },
  syslog: {
    placeholder: T("Syslog"),
    tooltip: T("Store system logs on the system dataset. Unset to store\
 system logs in <i>/var/</i> on the operating system device.")
  },
  syslog_warning: {
    title: T("WARNING"),
    message: T("The Passive controller must be rebooted in order to change the location of system logs.")
  },
  pool_warning: {
    title: T("WARNING"),
    message: T("The Passive controller must be rebooted in order to change the location of the system dataset.")
  }
};

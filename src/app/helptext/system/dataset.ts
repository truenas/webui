import { T } from "app/translate-marker";

export const helptext_system_dataset = {
  pool: {
    placeholder: T("System Dataset Pool"),
    tooltip: T("Select the pool to contain the system dataset.")
  },
  syslog: {
    placeholder: T("Syslog"),
    tooltip: T("Store system logs on the system dataset. Unset to store\
 system logs in <i>/var/</i> on the operating system device.")
  },
  rrd: {
    placeholder: T("Reporting Database"),
    tooltip: T("Store the reporting database on the system dataset.\
 Unset to store reporting information in the system memory."
    )
  }
};

import { T } from "app/translate-marker";

export const helptext_system_dataset = {
  pool: {
    placeholder: T("System Dataset Pool"),
    tooltip: T("Select the pool to contain the system dataset.")
  },
  syslog: {
    placeholder: T("Syslog"),
    tooltip: T("Set to store the system log on the system dataset.")
  },
  rrd: {
    placeholder: T("Reporting Database"),
    tooltip: T(
      "Store reporting information on the system dataset.\
 When unset, reporting information is stored to a RAM\
 disk to avoid filling /var."
    )
  }
};

import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_ntpservers = {
  add: {
    address: {
      placeholder: T("Address"),
      tooltip: T("Enter the hostname or IP address of the <b>NTP</b>\
 server.")
    },

    burst: {
      placeholder: T("Burst"),
      tooltip: T(
        "Recommended when <i>Max. Poll</i> is greater\
 than 10. Only use on personal NTP servers or those\
 under direct control. <b>Do not</b> enable when using\
 public NTP servers."
      )
    },

    iburst: {
      placeholder: T("IBurst"),
      tooltip: T(
        "Speeds up the initial synchronization\
 (seconds instead of minutes)."
      )
    },

    prefer: {
      placeholder: T("Prefer"),
      tooltip: T(
        "Should only be used for highly accurate <b>NTP</b>\
 servers such as those with time monitoring hardware."
      )
    },

    minpoll: {
      placeholder: T("Min Poll"),
      tooltip: T(
        "The minimum polling interval, in seconds, as a power of 2. \
 For example, <i>6</i> means 2^6, or 64 seconds. The default is 6, \
 minimum value is 4."
      ),
      validation: [Validators.min(4), Validators.required]
    },

    maxpoll: {
      placeholder: T("Max Poll"),
      tooltip: T(
        "The maximum polling interval, in seconds, as a power of 2. \
 For example, <i>10</i> means 2^10, or 1,024 seconds. The default is \
 10, maximum value is 17."
      )
    },

    force: {
      placeholder: T("Force"),
      tooltip: T(
        "Forces the addition of the <b>NTP</b> server,\
 even if it is currently unreachable."
      )
    }
  },

  edit: {
    address: {
      placeholder: T("Address"),
      tooltip: T(
        "Enter the hostname or IP address of the <b>NTP</b>\
   server."
      )
    },

    burst: {
      placeholder: T("Burst"),
      tooltip: T(
        "Recommended when <i>Max. Poll</i> is greater\
   than 10. Only use on personal NTP servers or those\
   under direct control. <b>Do not</b> enable when using\
   public NTP servers."
      )
    },

    iburst: {
      placeholder: T("IBurst"),
      tooltip: T(
        "Speeds up the initial synchronization\
   (seconds instead of minutes)."
      )
    },

    prefer: {
      placeholder: T("Prefer"),
      tooltip: T(
        "Should only be used for highly accurate <b>NTP</b>\
   servers such as those with time monitoring hardware."
      )
    },

    minpoll: {
      placeholder: T("Min. Poll"),
      tooltip: T(
        "Power of 2 in seconds; cannot be lower than 4 or\
   higher than <i>Max. Poll</i>."
      ),
      validation: [Validators.min(4), Validators.required]
    },

    maxpoll: {
      placeholder: T("Max. Poll"),
      tooltip: T(
        "Power of 2 in seconds; cannot be higher than 17 or\
   lower than <i>Min. Poll</i>."
      )
    },

    force: {
      placeholder: T("Force"),
      tooltip: T(
        "Forces the addition of the <b>NTP</b> server,\
   even if it is currently unreachable."
      )
    }
  },

  list: {}
};

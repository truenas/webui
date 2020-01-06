import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_tunable = {
  metadata:{
    fieldsets:[T('Tunable')]
  },
  var: {
    placeholder: T("Variable"),
    tooltip: T(
      "Enter the name of the loader, sysctl, or rc.conf\
 variable to configure. <i>loader</i> tunables are used\
 to specify parameters to pass to the kernel or load\
 additional modules at boot time. <i>rc.conf</i>\
 tunables are for enabling system services and daemons\
 and only take effect after a reboot. <i>sysctl</i> \
 tunables are used to configure kernel parameters while\
 the system is running and generally take effect\
 immediately."
    ),
    validation: [Validators.required]
  },

  value: {
    placeholder: T("Value"),
    tooltip: T(
      'Enter a value to use for the <a\
 href="https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/boot-introduction.html#boot-loader-commands"\
 target="_blank">loader</a>, <a\
 href="https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/configtuning-sysctl.html"\
 target="_blank">sysctl</a>, or <a\
 href="https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/config-tuning.html"\
 target="_blank">rc.conf</a> variable.'
    ),
    validation: [Validators.required]
  },

  type: {
    placeholder: T("Type"),
    tooltip: T(
      "Creating or editing a <i>sysctl</i> immediately\
 updates the Variable to the configured Value. A restart\
 is required to apply <i>loader</i> or <i>rc.conf</i>\
 tunables. Configured tunables remain in effect until\
 deleted or Enabled is unset."
    )
  },

  description: {
    placeholder: T("Description"),
    tooltip: T("Enter a description of the tunable.")
  },

  enabled: {
    placeholder: T("Enabled"),
    tooltip: T(
      "Enable this tunable. Unset to disable this tunable\
 without deleting it."
    )
  }
};

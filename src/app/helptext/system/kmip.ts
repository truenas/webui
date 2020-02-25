import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_kmip = {
    fieldset_server: T('KMIP Server'),
    fieldset_certificate: T('Certifiacte'),
    fieldset_management: T('Management'),

    server: {
        placeholder: T('Server'),
        tooltip: T(''),
    },

    port: {
        placeholder: T('Port'),
        tooltip: T(''),
    },

    certificate: {
        placeholder: T('Certificate'),
        tooltip: T(''),
    },

    certificate_authority: {
        placeholder: T('Certificate Authority'),
        tooltip: T(''),
    },

    manage_sed_disks: {
        placeholder: T('Manage SED Password'),
        tooltip: T(''),
    },

    manage_zfs_keys: {
        placeholder: T('Manage ZFS Keys'),
        tooltip: T(''),
    },

    jobDialog: {
        title: T('Saving KMIP Config'),
    }
}
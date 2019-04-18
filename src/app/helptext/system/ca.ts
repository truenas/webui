import { Validators } from "@angular/forms";
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";
import { T } from "app/translate-marker";

export const helptext_system_ca = {
  add: {
    name: {
      placeholder: T("Identifier"),
      tooltip: T("Enter a description of the CA."),
      validation: [Validators.required, Validators.pattern("[A-Za-z0-9_-]+$")]
    },

    create_type: {
      placeholder: T("Type")
    },

    signedby: {
      placeholder: T("Signing Certificate Authority"),
      tooltip: T(
        'Select a previously imported or created <a\
 href="%%docurl%%/system.html#cas"\
 target="_blank">CA</a>.'
      ),
      validation: [Validators.required]
    },

    key_length: {
      placeholder: T("Key Length"),
      tooltip: T(
        "The number of bits in the key used by the\
 cryptographic algorithm. For security reasons,\
 a minimum key length of <i>2048</i> is recommended."
      ),
      validation: [Validators.required]
    },

    digest_algorithm: {
      placeholder: T("Digest Algorithm"),
      tooltip: T(
        "The cryptographic algorithm to use. The default\
 <i>SHA256</i> only needs to be changed if the\
 organization requires a different algorithm."
      ),
      validation: [Validators.required]
    },

    lifetime: {
      placeholder: T("Lifetime"),
      tooltip: T("The lifetime of the CA specified in days."),
      validation: [Validators.required, Validators.min(0)]
    },

    country: {
      placeholder: T("Country"),
      tooltip: T("Select the country of the organization."),
      validation: [Validators.required]
    },

    state: {
      placeholder: T("State"),
      tooltip: T("Enter the state or province of the organization."),
      validation: [Validators.required]
    },

    city: {
      placeholder: T("Locality"),
      tooltip: T(
        "Enter the location of the organization. For example,\
 the city."
      ),
      validation: [Validators.required]
    },

    organization: {
      placeholder: T("Organization"),
      tooltip: T("Enter the name of the company or organization."),
      validation: [Validators.required]
    },

    email: {
      placeholder: T("Email"),
      tooltip: T(
        "Enter the email address of the person responsible for\
 the CA."
      ),
      validation: [Validators.email, Validators.required]
    },

    common: {
      placeholder: T("Common Name"),
      tooltip: T(
        'Enter the <a href="https://kb.iu.edu/d/aiuv"\
 target="_blank">fully-qualified hostname (FQDN)</a> of\
 the system. This name must be unique within a\
 certificate chain.'
      ),
      validation: [Validators.required]
    },

    san: {
      placeholder: T("Subject Alternate Names"),
      tooltip: T(
        "Multi-domain support. Enter additional domains to\
 secure, separated by spaces. For example, if the\
 primary domain is example.com, entering www.example.com\
 will secure both addresses."
      )
    },

    certificate: {
      placeholder: T("Certificate"),
      tooltip: T("Paste the certificate for the CA."),
      validation: [Validators.required]
    },

    privatekey: {
      placeholder: T("Private Key"),
      tooltip: T(
        "Paste the private key associated with the\
 Certificate when available. Please provide\
 a key at least 1024 bits long."
      )
    },

    passphrase: {
      placeholder: T("Passphrase"),
      tooltip: T("Enter the passphrase for the Private Key."),
      validation: [matchOtherValidator("passphrase2")]
    },

    passphrase2: {
      placeholder: T("Confirm Passphrase")
    }
  },

  edit: {
    name: {
      placeholder: T("Identifier"),
      tooltip: T(
        "Enter an alphanumeric name for the certificate.\
 Underscore (_), and dash (-) characters are allowed."
      ),
      validation: [Validators.required]
    },

    certificate: {
      placeholder: T("Certificate")
    },

    privatekey: {
      placeholder: T("Private Key")
    }
  },

  list: {
    tooltip_route_add: T("Create CA"),

    column_name: T("Name"),
    column_internal: T("Internal"),
    column_issuer: T("Issuer"),
    column_distinguished_name: T("Distinguished Name"),
    column_from: T("From"),
    column_until: T("Until"),

    action_view: T("View"),
    action_sign: T("Sign CSR"),
    action_export_certificate: T("Export Certificate"),
    action_export_private_key: T("Export Private Key"),

    snackbar_open_window_message: T(
      "Opening download window. Make sure pop-ups are enabled in the browser."
    ),
    snackbar_open_window_action: T("Success"),

    action_delete: T("Delete")
  },

  sign: {
    ca_id: {
      placeholder: T("CA ID")
    },

    csr_cert_id: {
      placeholder: T("CSRs"),
      tooltip: T(
        "Select the Certificate Signing Request to sign the\
 Certificate Authority with."
      ),
      validation: [Validators.required]
    },

    name: {
      placeholder: T("Identifier"),
      tooltip: T(
        'Internal identifier of the certificate. Only\
 alphanumeric, "_" and "-" are allowed.'
      ),
      validation: [Validators.required]
    }
  }
};

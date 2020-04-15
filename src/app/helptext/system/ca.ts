import { Validators } from "@angular/forms";
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";
import { T } from "app/translate-marker";

export const helptext_system_ca = {
  add: {
    fieldset_basic: T('Identifier and Type'),
    fieldset_type: T('Certificate Options'),
    fieldset_certificate: T('Certificate Subject'),
    fieldset_basic_constraints: T('Basic Constraints'),
    fieldset_authority_key_identifier: T('Authority Key Identifier'),
    fieldset_extended_key_usage: T('Extended Key Usage'),
    fieldset_key_usage: T('Key Usage'),

    name: {
      placeholder: T("Name"),
      tooltip: T("Descriptive identifier for this certificate authority."),
      validation: [Validators.required, Validators.pattern("[A-Za-z0-9_-]+$")],
      errors: T('Allowed characters: letters, numbers, underscore (_), and dash (-).'),
    },

    create_type: {
      placeholder: T("Type")
    },

    profiles: {
      placeholder: T('Profiles'),
      tooltip: T('Predefined certificate extensions. Choose a profile that best \
matches your certificate usage scenario.'),
    },

    signedby: {
      placeholder: T("Signing Certificate Authority"),
      tooltip: T(
        'Select a previously imported or created <a\
 href="--docurl--/system.html#cas"\
 target="_blank">CA</a>.'
      ),
      validation: [Validators.required]
    },

    key_type: {
      placeholder: T("Key Type"),
      tooltip: T(
        'See <a href="https://crypto.stackexchange.com/questions/1190/why-is-elliptic-curve-cryptography-not-widely-used-compared-to-rsa" target="blank">\
 Why is elliptic curve cryptography not widely used, compared to RSA?</a>\
 for more information about key types.'
      ),
      validation: [Validators.required]
    },

    ec_curve: {
      placeholder: T("EC Curve"),
      tooltip: T(
        'Brainpool curves can be more secure, while secp curves can be faster. See\
 <a href="https://tls.mbed.org/kb/cryptography/elliptic-curve-performance-nist-vs-brainpool" target="blank">\
 Elliptic Curve performance: NIST vs Brainpool\
 </a> for more information.')
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

    organizational_unit: {
      placeholder: T("Organizational Unit"),
      tooltip: T("Organizational unit of the entity."),
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
        "Multi-domain support. Enter additional domains to \
 secure. Separate domains by pressing <code>Enter</code> \
 For example, if the primary domain is <i>example.com</i>, \
 entering <i>www.example.com</i> secures both addresses."
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
    },

    basic_constraints: {
      ca: {
        placeholder: T('CA'),
        tooltip: T('Identify this certificate as a Certificate Authority (CA).'),
      },
      enabled: {
        placeholder: T('Enabled'),
        tooltip: T('Activate this certificate extension.'),
      },
      path_length: {
        placeholder: T('Path Length'),
        tooltip: T('How many non-self-issued intermediate certificates that can follow \
this certificate in a valid certification path. Entering <i>0</i> allows a single \
additional certificate to follow in the certificate path. Cannot be less than <i>0</i>.'),
      },
      extension_critical: {
        placeholder: T('Critical Extension'),
        tooltip: T('Identify this extension as critical for the certificate. Critical extensions must \
be recognized by the certificate-using system or this certificate will be rejected. Extensions \
identified as <i>not</i> critical can be ignored by the certificate-using system and the \
certificate still approved.'),
      },
    },

    authority_key_identifier: {
      authority_cert_issuer: {
        placeholder: T('Authority Cert Issuer'),
        tooltip: T('Pair this certificate\'s public key with the Certificate Authority private \
key used to sign this certificate.'),
      },
      enabled: {
        placeholder: T('Enabled'),
        tooltip: T('Activate this certificate extension.'),
      },
      extension_critical: {
        placeholder: T('Critical Extension'),
        tooltip: T('Identify this extension as critical for the certificate. Critical extensions must \
be recognized by the certificate-using system or this certificate will be rejected. Extensions \
identified as <i>not</i> critical can be ignored by the certificate-using system and the \
certificate still approved.'),
      },
    },

    extended_key_usage: {
      usages: {
        placeholder: T('Usages'),
        tooltip: T('Identify the purpose for this public key. Typically used for end \
entity certificates. Multiple usages can be selected. Do not mark this extension \
critical when the <i>Usage</i> is <i>ANY_EXTENDED_KEY_USAGE</i>.<br><br> \
Using both <b>Extended Key Usage</b> and <b>Key Usage</b> extensions \
requires that the purpose of the certificate is consistent with both extensions. See \
<a href="https://www.ietf.org/rfc/rfc3280.txt" target="_blank">RFC 3280, section 4.2.1.13</a> \
for more details.'),
      },
      enabled: {
        placeholder: T('Enabled'),
        tooltip: T('Activate this certificate extension.'),
      },
      extension_critical: {
        placeholder: T('Critical Extension'),
        tooltip: T('Identify this extension as critical for the certificate. Critical extensions must \
be recognized by the certificate-using system or this certificate will be rejected. Extensions \
identified as <i>not</i> critical can be ignored by the certificate-using system and the \
certificate still approved.'),
      },
    },

    key_usage: {
      enabled: {
        placeholder: T('Enabled'),
        tooltip: T('Activate this certificate extension.'),
      },
      digital_signature: {
        placeholder: T('Digital Signature'),
        tooltip: T('This certificate\'s public key is used with digital signature methods \
that are separate from certificate or CRL signing.'),
      },
      content_commitment: {
        placeholder: T('Content Commitment'),
        tooltip: T('This certificate\'s public key verifies digital signatures used for a \
non-repudiation service.'),
      },
      key_encipherment: {
        placeholder: T('Key Encipherment'),
        tooltip: T('This certificate\'s public key is used for key management.'),
      },
      data_encipherment: {
        placeholder: T('Data Encipherment'),
        tooltip: T('This certificate\'s public key is used to encipher user data.'),
      },
      key_agreement: {
        placeholder: T('Key Agreement'),
        tooltip: T('This certificate\'s public key is used to manage key agreement.'),
      },
      key_cert_sign: {
        placeholder: T('Key Cert Sign'),
        tooltip: T('This certificate\'s public key is used to verify signatures on \
other public key certificates. Activating this also requires enabling the \
<b>CA</b> basic constraint.'),
      },
      crl_sign: {
        placeholder: T('CRL Sign'),
        tooltip: T('This certificate\'s public key is used to verify signatures \
on a certificate revocation list (CRL).'),
      },
      encipher_only: {
        placeholder: T('Encipher Only'),
        tooltip: T('The certificate\'s public key is used to encipher user \
data only during key agreement operations. Requires that \
<b>Key Agreement</b> is also set.'),
      },
      decipher_only: {
        placeholder: T('Decipher Only'),
        tooltip: T('This certificate\'s public key is used to decipher \
user data only during key agreement operations. Requires that \
<b>Key Agreement</b> is also set.'),
      },
      extension_critical: {
        placeholder: T('Critical Extension'),
        tooltip: T('Identify this extension as critical for the certificate. Critical extensions must \
be recognized by the certificate-using system or this certificate will be rejected. Extensions \
identified as <i>not</i> critical can be ignored by the certificate-using system and the \
certificate still approved.'),
      },
    },
  },

  edit: {
    fieldset_certificate: T('Certificate Authority'),
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
    
    action_delete: T("Delete")
  },

  sign: {
    fieldset_certificate: T('Sign CSR'),
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

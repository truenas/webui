import { Validators } from "@angular/forms";
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";
import { T } from "app/translate-marker";

export const helptext_system_certificates = {
  add: {
    title: T('Add Certificate'),
    title_csr: T('Add CSR'),
    fieldset_basic: T('Identifier and Type'),
    fieldset_type: T('Certificate Options'),
    fieldset_certificate: T('Certificate Subject'),
    fieldset_basic_constraints: T('Basic Constraints'),
    fieldset_extra: T('Extra Constraints'),
    fieldset_authority_key_identifier: T('Authority Key Identifier'),
    fieldset_extended_key_usage: T('Extended Key Usage'),
    fieldset_key_usage: T('Key Usage'),

    name: {
      placeholder: T("Name"),
      tooltip: T("Descriptive identifier for this certificate."),
      validation: [Validators.required, Validators.pattern("[A-Za-z0-9_-]+$")],
      errors: T('Allowed characters: letters, numbers, underscore (_), and dash (-).'),
    },

    cert_create_type: {
      placeholder: T("Type"),
      tooltip: T('<i>Internal Certificate</i> is used for internal or local \
 systems. <i>Import Certificate</i> allows an existing certificate to be imported onto \
 the system.'),
  options: [
    { label: T('Internal Certificate'), value: 'CERTIFICATE_CREATE_INTERNAL' },
    { label: T('Import Certificate'), value: 'CERTIFICATE_CREATE_IMPORTED' },
  ],
  value: 'CERTIFICATE_CREATE_INTERNAL'
    },

    csr_create_type: {
      placeholder: T("Type"),
      tooltip: T('<i>Certificate Signing Request</i> is used to get a CA signature. \
 <i>Import Certificate Signing Request</i> allows an existing CSR \
 to be imported onto the system.'),
  options: [
    { label: T('Certificate Signing Request'), value: 'CERTIFICATE_CREATE_CSR' },
    { label: T('Import Certificate Signing Request'), value: 'CERTIFICATE_CREATE_IMPORTED_CSR' },
  ],
  value: 'CERTIFICATE_CREATE_CSR'
    },

    profiles: {
      placeholder: T('Profiles'),
      tooltip: T('Predefined certificate extensions. Choose a profile that best \
matches your certificate usage scenario.'),
    },

    isCSRonSystem: {
      placeholder: T("CSR exists on this system"),
      tooltip: T(
        'Check this box if importing a certificate for which a CSR exists on this system'
      )
    },
    
    signedby: {
      placeholder: T("Signing Certificate Authority"),
      tooltip: T(
        'Select a previously imported or created CA.'
      ),
      validation: [Validators.required]
    },

    key_type: {
      placeholder: T("Key Type"),
      validation: [Validators.required]
    },

    ec_curve: {
      placeholder: T("EC Curve")
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
    },

    san: {
      placeholder: T("Subject Alternate Names"),
      tooltip: T(
        "Multi-domain support. Enter additional domains to \
 secure. Separate domains by pressing <code>Enter</code> \
 For example, if the primary domain is <i>example.com</i>, \
 entering <i>www.example.com</i> secures both addresses."
      ),
      validation: [Validators.required]
    },

    certificate: {
      placeholder: T("Certificate"),
      tooltip: T("Paste the certificate for the CA."),
      validation: [Validators.required]
    },

    cert_csr: {
      placeholder: T("Signing Request"),
      tooltip: T("Paste the contents of your Certificate Signing Request here."),
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
      config: {
        placeholder: T('Basic Constraints Config'),
        tooltip: T('The basic constraints extension identifies whether the \
 subject of the certificate is a CA and the maximum depth of valid \
 certification paths that include this certificate. <br> \
 See <a href="https://www.ietf.org/rfc/rfc3280.txt">RFC 3280, section 4.2.1.10</a> \
 for more information.'),
      },
      ca: {
        placeholder: T('CA'),
        tooltip: T('Identify this certificate as a Certificate Authority (CA).'),
      },
      enabled: {
        placeholder: T('Basic Constraints'),
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
      config: {
        placeholder: T('Authority Key Config'),
        tooltip: T('The authority key identifier extension provides a means of \
 identifying the public key corresponding to the private key used to \
 sign a certificate. This extension is used where an issuer has \
 multiple signing keys (either due to multiple concurrent key pairs or \
 due to changeover). The identification MAY be based on either the \
 key identifier (the subject key identifier in the issuer\'s \
 certificate) or on the issuer name and serial number.<br> \
 See <a href="https://www.ietf.org/rfc/rfc3280.txt">RFC 3280, section 4.2.1.1</a> \
 for more information.'),
      },
      authority_cert_issuer: {
        placeholder: T('Authority Cert Issuer'),
        tooltip: T('Pair this certificate\'s public key with the Certificate Authority private \
key used to sign this certificate.'),
      },
      enabled: {
        placeholder: T('Authority Key Identifier'),
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
        placeholder: T('Extended Key Usage'),
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
      config: {
        placeholder: T('Key Usage Config'),
        tooltip: T('The key usage extension defines the purpose \
 (e.g., encipherment, signature, certificate signing) of the key contained in \
 the certificate. The usage restriction might be employed when a key that \
 could be used for more than one operation is to be restricted. For \
 example, when an RSA key should be used only to verify signatures on \
 objects other than public key certificates and CRLs, the <i>Digital Signature</i> \
 bits would be asserted. Likewise, when an RSA key should be used only for key \
 management, the <i>Key Encipherment</i> bit would be asserted. <br> \
 See <a href="https://www.ietf.org/rfc/rfc3280.txt">RFC 3280, section 4.2.1.3</a> \
 for more information.'),
      },
      enabled: {
        placeholder: T('Key Usage'),
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
    }
  },

  edit: {
    title: T('Edit Certificate'),
    titleCSR: T('Edit CSR'),
    fieldset_certificate: T('Certificate'),
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
    },

    csr: {
      placeholder: T("Signing Request")
    },

    subject: T('Subject'),

    signCSR: T('Sign CSR')
  },

  list: {
      tooltip_add: T('Create Certificate'),

      column_name: T('Name'),
      column_issuer: T('Issuer'),
      column_distinguished_name: T('Distinguished Name'),
      column_from: T('From'),
      column_until: T('Until'),

      action_view: T("View"),
      action_export_certificate: T("Export Certificate"),
      action_export_private_key: T("Export Private Key"),

      action_create_acme_certificate: T("Create ACME Certificate"),

      download_error_dialog: {
        title: T('Error'),
        cert_message: T('Error exporting the certificate'),
        key_message: T('Error exporting the Private Key')
      }, 

      action_delete: T("Delete")
  },

  acme: {
    fieldset_acme: T('ACME Certificate'),
    identifier: {
      placeholder: T("Identifier"),
      tooltip: T('Internal identifier of the certificate. Only\
 alphanumeric characters, dash (<b>-</b>), and underline (<b>_</b>) are\
 allowed.')
    },
    tos: {
      placeholder: T("Terms of Service"),
      tooltip: T("Please accept the terms of service for the given ACME\
 Server.")
    },
    renew_day: {
      placeholder: T("Renew Certificate Days"),
      tooltip: T("Number of days to renew certificate before expiring."),
      validation: [Validators.required, Validators.min(0)]
    },
    dir_uri: {
      placeholder: T("ACME Server Directory URI"),
      tooltip: T("URI of the ACME Server Directory. Choose a\
 preconfigured URI or enter a custom URI.")
    },
    authenticator: {
      placeholder: T("Authenticator"),
      tooltip: T("Authenticator to validate the Domain. Choose a\
 previously configured ACME DNS authenticator."),
    },
    job_dialog_title: T('Creating...'),
    error_dialog: {
      title: T('Error')
    }
    
  },

  viewButton: {
    certificate: T('View/Download Certificate'),
    csr: T('View/Download CSR'),
    key: T('View/Download Key')
  },

  viewDialog: {
    download: T('Download'),
    close: T('Close'),
    copy: T('Copy')
  },

  edit_view: {
    country: T('Country: '),
    state: T('State: '),
    city: T('City: '),
    organization: T('Organization: '),
    organizational_unit: T('Organizational Unit: '),
    email: T('Email: '),
    common: T('Common: '),
    san: T('SAN: '),
    DN: T('Distinguished Name: '),
    type: T('Type: '),
    path: T('Path: '),
    digest_algorithm: T('Digest Algorithm: '),
    key_length: T('Key Length: '),
    key_type: T('Key Type: '),
    unitl: T('Until: '),
    issuer: T('Issuer: '),
    revoked: T('Revoked: '),
    signed_by: T('Signed By: '),
    signed_certificates: T('Signed Certificates: '),
    lifetime: T('Lifetime: ')
  }
};

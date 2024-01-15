import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { helptextSystemCa } from 'app/helptext/system/ca';

export const helptextSystemCertificates = {
  add: {
    name: {
      tooltip: T('Descriptive identifier for this certificate.'),
      errors: T('Allowed characters: letters, numbers, underscore (_), and dash (-).'),
    },

    cert_create_type: {
      tooltip: T('<i>Internal Certificates</i> use system-managed CAs for certificate issuance. \
 <i>Import Certificate</i> lets you import an existing certificate onto the system.'),
    },

    csr_create_type: {
      placeholder: T('Type'),
      tooltip: T('<i>Certificate Signing Requests</i> control when an external CA will issue (sign) the certificate. Typically used with ACME or other CAs that most popular browsers trust by default \
 <i>Import Certificate Signing Request</i> lets you import an existing CSR onto the system. Typically used with ACME or internal CAs.'),
    },

    profiles: {
      tooltip: T('Predefined certificate extensions. Choose a profile that best \
matches your certificate usage scenario.'),
    },

    isCSRonSystem: {
      tooltip: T(
        'Check this box if importing a certificate for which a CSR exists on this system',
      ),
    },

    csrlist: {
      tooltip: T(
        'Select an existing CSR.',
      ),
    },

    signedby: {
      tooltip: T(
        'Select a previously imported or created CA.',
      ),
    },

    key_type: {
      tooltip: helptextSystemCa.add.key_type.tooltip,
    },

    ec_curve: {
      tooltip: helptextSystemCa.add.ec_curve.tooltip,
    },

    key_length: {
      tooltip: T(
        'The number of bits in the key used by the\
 cryptographic algorithm. For security reasons,\
 a minimum key length of <i>2048</i> is recommended.',
      ),
    },

    digest_algorithm: {
      tooltip: T(
        'The cryptographic algorithm to use. The default\
 <i>SHA256</i> only needs to be changed if the\
 organization requires a different algorithm.',
      ),
    },

    lifetime: {
      placeholder: T('Lifetime'),
      tooltip: T('The lifetime of the CA specified in days.'),
      validation: [Validators.required, Validators.min(0)],
    },

    country: {
      tooltip: T('Select the country of the organization.'),
    },

    state: {
      tooltip: T('Enter the state or province of the organization.'),
    },

    city: {
      tooltip: T(
        'Enter the location of the organization. For example,\
 the city.',
      ),
    },

    organization: {
      tooltip: T('Enter the name of the company or organization.'),
    },

    organizational_unit: {
      tooltip: T('Organizational unit of the entity.'),
    },

    email: {
      tooltip: T(
        'Enter the email address of the person responsible for\
 the CA.',
      ),
    },

    common: {
      tooltip: T(
        'Enter the <a href="https://kb.iu.edu/d/aiuv"\
 target="_blank">fully-qualified hostname (FQDN)</a> of\
 the system. This name must be unique within a\
 certificate chain.',
      ),
    },

    san: {
      tooltip: T(
        'Multi-domain support. Enter additional domains to \
 secure. Separate domains by pressing <code>Enter</code> \
 For example, if the primary domain is <i>example.com</i>, \
 entering <i>www.example.com</i> secures both addresses.',
      ),
    },

    certificate: {
      tooltip: T('Paste the certificate for the CA.'),
    },

    cert_csr: {
      tooltip: T('Paste the contents of your Certificate Signing Request here.'),
    },

    privatekey: {
      tooltip: T(
        'Paste the private key associated with the\
 Certificate when available. Please provide\
 a key at least 1024 bits long.',
      ),
    },

    passphrase: {
      tooltip: T('Enter the passphrase for the Private Key.'),
    },

    basic_constraints: {
      config: {
        tooltip: T('Specify whether to use the certificate for a Certificate Authority \
          and whether this extension is critical. Clients must recognize critical extensions \
          to prevent rejection. Web certificates typically require you to disable \
          CA and enable Critical Extension.'),
      },
      ca: {
        placeholder: T('CA'),
        tooltip: T('Identify this certificate as a Certificate Authority (CA).'),
      },
      enabled: {
        tooltip: T('Activate the Basic Constraints extension to identify whether \
          the certificate\'s subject is a CA and the maximum depth of valid \
          certification paths that include this certificate.'),
      },
      path_length: {
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
        tooltip: T('Specify whether the issued certificate should include Authority Key Identifier information,\
          and whether the extension is critical. Critical extensions must be recognized by the client or be rejected.'),
      },
      authority_cert_issuer: {
        placeholder: T('Authority Cert Issuer'),
        tooltip: T('Pair this certificate\'s public key with the Certificate Authority private \
key used to sign this certificate.'),
      },
      enabled: {
        tooltip: T('Activate this extension.\
 The authority key identifier extension provides a means of \
 identifying the public key corresponding to the private key used to \
 sign a certificate. This extension is used where an issuer has \
 multiple signing keys (either due to multiple concurrent key pairs or \
 due to changeover). The identification MAY be based on either the \
 key identifier (the subject key identifier in the issuer\'s \
 certificate) or on the issuer name and serial number.<br> \
 See <a href="https://www.ietf.org/rfc/rfc3280.txt">RFC 3280, section 4.2.1.1</a> \
 for more information.'),
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
        tooltip: T('Identify the purpose for this public key. Typically used for end \
entity certificates. Multiple usages can be selected. Do not mark this extension \
critical when the <i>Usage</i> is <i>ANY_EXTENDED_KEY_USAGE</i>.<br><br> \
Using both <b>Extended Key Usage</b> and <b>Key Usage</b> extensions \
requires that the purpose of the certificate is consistent with both extensions. See \
<a href="https://www.ietf.org/rfc/rfc3280.txt" target="_blank">RFC 3280, section 4.2.1.13</a> \
for more details.'),
      },
      enabled: {
        tooltip: T('Activate this certificate extension.\
The Extended Key Usage extension identifies and limits valid uses for this certificate, such as client authentication or server authentication.\
See <a href="https://www.ietf.org/rfc/rfc3280.txt" target="_blank">RFC 3280, section 4.2.1.13</a> \
for more details.'),
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
        tooltip: T('Specify this certificate\'s valid Key Usages. Web certificates \
          typically need at least Digital Signature and possibly Key Encipherment \
          or Key Agreement, while other applications may need other usages.'),
      },
      enabled: {
        tooltip: T('Activate this certificate extension.\
  The key usage extension defines the purpose \
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
    name: {
      tooltip: T(
        'Enter an alphanumeric name for the certificate.\
 Underscore (_), and dash (-) characters are allowed.',
      ),
    },
    renew_days: {
      tooltip: T(
        'For example if you set this value to 5, system will renew certificates that expire in 5 days or less.',
      ),
    },
  },

  list: {
    download_error_dialog: {
      title: T('Error'),
      cert_message: T('Error exporting the certificate'),
      key_message: T('Error exporting the Private Key'),
    },

    action_delete: T('Delete'),
  },

  acme: {
    identifier: {
      tooltip: T('Internal identifier of the certificate. Only\
 alphanumeric characters, dash (<b>-</b>), and underline (<b>_</b>) are\
 allowed.'),
    },
    tos: {
      tooltip: T('Please accept the terms of service for the given ACME\
 Server.'),
    },
    renew_day: {
      tooltip: T('Number of days to renew certificate before expiring.'),
    },
    dir_uri: {
      tooltip: T('URI of the ACME Server Directory. Choose a pre configured URI'),
      custom_checkbox_tooltip: T('Use Custom ACME Server Directory URI'),
      custom_input_tooltip: T('URI of the ACME Server Directory. Enter a custom URI.'),
    },
    authenticator: {
      tooltip: T('Authenticator to validate the Domain. Choose a\
 previously configured ACME DNS authenticator.'),
    },
    error_dialog: {
      title: T('Error'),
    },

  },
};

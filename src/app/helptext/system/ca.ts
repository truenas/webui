import { Validators } from "@angular/forms";
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";
import { T } from "app/translate-marker";

export const helptext_system_ca = {
  add: {
    title: T('Add CA'),
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
      tooltip: T("Descriptive identifier for this certificate authority."),
      validation: [Validators.required, Validators.pattern("[A-Za-z0-9_-]+$")],
      errors: T('Allowed characters: letters, numbers, underscore (_), and dash (-).'),
    },

    create_type: {
      placeholder: T("Type"),
      tooltip: T('Choose between <i>Internal CA</i>, <i>Intermediate CA</i>, and \
 <i>Import CA</i>. An <i>Internal CA</i> functions like a publicly trusted CA \
 to sign certificates for an internal network. They are not trusted outside \
 the private network. An <i>Intermediate CA</i> lives between the root and end \
 entity certificates and its main purpose is to define and authorize the \
 types of certificates that can be requested from the root CA. <i>Import CA</i> \
 allows an existing CA to be imported onto the system.<br> \
 For more information see \
 <a href="https://www.globalsign.com/en/blog/what-is-an-intermediate-or-subordinate-certificate-authority"> \
 What are Subordinate CAs and Why Would You Want Your Own?</a>')
    },

    profiles: {
      placeholder: T('Profiles'),
      tooltip: T('Predefined certificate extensions. Choose a profile that best \
matches your certificate usage scenario.'),
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
 for more information.')
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
    },
  },

  edit: {
    title: T('Edit CA'),
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
    },
    sign: T('Sign')
  },
  error: T('Error'),
  private_key: T('Private Key'),

  delete_error: {
    title: T('Error'),
    message: T('This Certificate Authority is being used to sign one or more certificates. It can be deleted \
 only after deleting these certificates.'),
    button: T('Close')
  }
};

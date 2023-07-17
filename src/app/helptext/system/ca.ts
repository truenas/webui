import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemCa = {
  add: {
    name: {
      tooltip: T('Descriptive identifier for this certificate authority.'),
      errors: T('Allowed characters: letters, numbers, underscore (_), and dash (-).'),
    },

    create_type: {
      tooltip: T('Choose between <i>Internal CA</i>, <i>Intermediate CA</i>, and \
 <i>Import CA</i>. An <i>Internal CA</i> functions like a publicly trusted CA \
 to sign certificates for an internal network. They are not trusted outside \
 the private network. An <i>Intermediate CA</i> lives between the root and end \
 entity certificates and its main purpose is to define and authorize the \
 types of certificates that can be requested from the root CA. <i>Import CA</i> \
 allows an existing CA to be imported onto the system.<br> \
 For more information see \
 <a href="https://www.globalsign.com/en/blog/what-is-an-intermediate-or-subordinate-certificate-authority"> \
 What are Subordinate CAs and Why Would You Want Your Own?</a>'),
    },

    profiles: {
      tooltip: T('Predefined certificate extensions. Choose a profile that best \
matches your certificate usage scenario.'),
    },

    signedby: {
      tooltip: T(
        'Select a previously imported or created CA.',
      ),
    },

    key_type: {
      tooltip: T(
        'See <a href="https://crypto.stackexchange.com/questions/1190/why-is-elliptic-curve-cryptography-not-widely-used-compared-to-rsa" target="blank">\
 Why is elliptic curve cryptography not widely used, compared to RSA?</a>\
 for more information about key types.',
      ),
    },

    ec_curve: {
      tooltip: T(
        'Brainpool curves can be more secure, while secp curves can be faster. See\
 <a href="https://tls.mbed.org/kb/cryptography/elliptic-curve-performance-nist-vs-brainpool" target="blank">\
 Elliptic Curve performance: NIST vs Brainpool\
 </a> for more information.',
      ),
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
      tooltip: T('The lifetime of the CA specified in days.'),
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
  },

  list: {
    action_sign: T('Sign CSR'),
  },

  sign: {
    csr_cert_id: {
      tooltip: T(
        'Select the Certificate Signing Request to sign the\
 Certificate Authority with.',
      ),
    },

    name: {
      tooltip: T(
        'Internal identifier of the certificate. Only\
 alphanumeric, "_" and "-" are allowed.',
      ),
    },
  },

  delete_error: {
    title: T('Error'),
    message: T('This Certificate Authority is being used to sign one or more certificates. It can be deleted \
 only after deleting these certificates.'),
    button: T('Close'),
  },
};

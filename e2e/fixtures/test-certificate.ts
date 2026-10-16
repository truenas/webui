/**
 * A fixed, test-only self-signed certificate and its private key, for the
 * Import Certificate journey.
 *
 * Checked in rather than generated per run because Node's crypto can make a key
 * pair but cannot sign an X.509 certificate without a library. Neither is a
 * credential for anything: the key signs only this certificate, and the
 * certificate names a host under `example.com`.
 *
 * RSA 2048, SHA256, valid from 2026-01-01 to 2076-01-01. The key is unencrypted
 * PKCS#8, the form middleware re-exports an imported key in, so the key the
 * appliance hands back is the one imported here, byte for byte.
 */

/** The certificate's subject common name, and its one SAN. */
export const testCertificateCommon = 'e2e-import.example.com';

export const testCertificatePem = '-----BEGIN CERTIFICATE-----\n'
  + 'MIIDTzCCAjegAwIBAgIUZuIZf7Ev+nTzmLmBHQuy9rJXf+QwDQYJKoZIhvcNAQEL\n'
  + 'BQAwRjELMAkGA1UEBhMCVVMxFjAUBgNVBAoMDWlYc3lzdGVtcyBFMkUxHzAdBgNV\n'
  + 'BAMMFmUyZS1pbXBvcnQuZXhhbXBsZS5jb20wIBcNMjYwMTAxMDAwMDAwWhgPMjA3\n'
  + 'NjAxMDEwMDAwMDBaMEYxCzAJBgNVBAYTAlVTMRYwFAYDVQQKDA1pWHN5c3RlbXMg\n'
  + 'RTJFMR8wHQYDVQQDDBZlMmUtaW1wb3J0LmV4YW1wbGUuY29tMIIBIjANBgkqhkiG\n'
  + '9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqzByiDF1ysiiO/9irJmnmhytMgiliwGAg5SC\n'
  + 'XwXfZPHTp3oZREP2ZIpiPbbGmRLHuQngnzuAP0g1WxY6g93Q82MUDeGO+ekRizF8\n'
  + 'cGWX375h8EOdp1xKxJ89tuHuLA2/4eHFuCaIIZULtd12Jk4xjfS1vRvPi6GKZb4S\n'
  + '4sDukAJtoyaynAbp8n8OKCRL40/u2HCKs61Pv6KueXfoEpvD35FddKyVO3ex6f5k\n'
  + 'nZIRtM/v1PIT+7XYZSeRpWg2EzPYbLl3DBce9v1JevXivAjlZKnkU3vmr6IS1ncI\n'
  + 'zyI1Eg5NrP/COx5pnFd8BD25tcfqxSmK7xZYmQBPAjz65JSK2QIDAQABozMwMTAh\n'
  + 'BgNVHREEGjAYghZlMmUtaW1wb3J0LmV4YW1wbGUuY29tMAwGA1UdEwEB/wQCMAAw\n'
  + 'DQYJKoZIhvcNAQELBQADggEBAG14ySrEJp3O8fZPRNggQCIhy8rCaMeYAoplnI9s\n'
  + 'LiXPk57N9l8dQPxSt8mBWM6G/GSZvkXP21VulBh/vHPs8o4WCKT2bW8JPPuftxZc\n'
  + 'azdrCkqfZoU1e+GU3UO3vZe8gsCqm2+eujOWOzuRjCT3zHRE7vD5rcj4DW3RgJYB\n'
  + 'Dgu4X7JTr8Rg8o0S/xraiqmNnZYePgami/WvSHZtfRwb8NQC4Kzo/JAI2HEMwFEZ\n'
  + 'AntWPHK/YDbA7J2PE1ZVDEgiHR77xP8x9lT/jrdLtz2L+wzpZV2E6QurmHYwEhdz\n'
  + 'kk4HA8DID1OCCRvO3xEYMdEdAmLMZSci9Q1J8uKvgmAhjXA=\n'
  + '-----END CERTIFICATE-----';

export const testPrivateKeyPem = '-----BEGIN PRIVATE KEY-----\n'
  + 'MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCrMHKIMXXKyKI7\n'
  + '/2KsmaeaHK0yCKWLAYCDlIJfBd9k8dOnehlEQ/ZkimI9tsaZEse5CeCfO4A/SDVb\n'
  + 'FjqD3dDzYxQN4Y756RGLMXxwZZffvmHwQ52nXErEnz224e4sDb/h4cW4JoghlQu1\n'
  + '3XYmTjGN9LW9G8+LoYplvhLiwO6QAm2jJrKcBunyfw4oJEvjT+7YcIqzrU+/oq55\n'
  + 'd+gSm8PfkV10rJU7d7Hp/mSdkhG0z+/U8hP7tdhlJ5GlaDYTM9hsuXcMFx72/Ul6\n'
  + '9eK8COVkqeRTe+avohLWdwjPIjUSDk2s/8I7HmmcV3wEPbm1x+rFKYrvFliZAE8C\n'
  + 'PPrklIrZAgMBAAECggEAAVkF9rPdR5STPMaAWzn13ne9oCVm1ixAvkh0LsBMFcOz\n'
  + 'QyTW+wwzHVNy6sa5tz+dh0rbipE9inYmqmxvv3/gyfYygaqB8VMnfonAMz0l9vzg\n'
  + 'BVU6Dnv1fdh//Y0DXOgqzhYfSWCRnboRcyBkX3oXFWplYo+5AlJgoWlkdL7blhvC\n'
  + 'ltnANQ7GfoeZqQyHAZE9i3rI+GGJrgUUMW2m6OVOuEj7WpR8BrS1Akx+YpR51C7n\n'
  + 'LoQUp7sKH5Y1bYoRaEbFRt6+tNK/5xD04mGWd4SvCaMlLwkcJvRF+cvzSS8b9mRD\n'
  + 'kDrZ1bbasQ0siQY6ZlGRcdlDg0HEp87H7xvIUQidZQKBgQDjXOtoReNJh2tOVrag\n'
  + 'lHcAsVOyw5mHch4gxgmcJWFydS7Go70SSeRP3Yzp5MG8i7Rfovx7GQYnAq61XKem\n'
  + 'Zs6Dc5QKBTuj1SPNVtD+frgqUG6bU4L4S/dwDV3y2nwrUMiWCefi0pkFoGpcd3Bk\n'
  + 'AiVAJrBIs/eVdBc+EgjBjZ/y6wKBgQDAwEPhUbNi1cJ8qVSAyx03TPgy0WmWgIV+\n'
  + 'zag8EmMaGlt9xCJQrpRZ9csOIvzIwEsygdI2IhIPYYkZDQpeU9zMGeZ6DJ8taxy2\n'
  + 'JyTkuEUUfFpNHktnFvR4Q8vdSkBc6pk5HDntt/gPMAQm0g0S6IUbL/4749vcZsZj\n'
  + 'vdQIpFEgSwKBgBdfSO/KJ2g6nIRME7AEMwuGLxV0WAb9ay1xTjGYAiFy/GD9GgWU\n'
  + 'RP0UyFSO6H+KWPtv1MaOtvwxoWYRZUaM0PPgYLp6+TuJQInuP8O5oRLwe75J4m/F\n'
  + '12TUavD5FsSZJFWQJR9DCOn0KJriyFHviobCs2J15aCec3k0/2NuPKALAoGAYTrb\n'
  + 'Qva2mZ2gnMfB87IBy9qMvP272Ip+TKerPJo92XYAPuHIOZDHDtYZFsl5YD7378Ni\n'
  + '6aGoIJAf2z4jw89j6qUKCPkC9qM4eX4ncySs3BeaaZpliNwgd+YjGT6SVwyUPCXL\n'
  + '5ulNPUQIZBjDNY2LT1qXUViwmG5Tlw6zvaQ9tB8CgYANfRvZD1ywgfDP5JjFY7Wx\n'
  + 'dk6Yw4mBNG+8RoNnv9wTBDg/4fS4D7fyI8haF56mdYFgCoNlNA4VhHfmtOdqTEBI\n'
  + 'Xd9IzfGmvpiU9IswVngH9N+xZBia7pbKqxPSRHU6SKFc1YqJwfZo+okWLsxg7aZ8\n'
  + 'sR9GHLNxDlRn/p5mzj5G3g==\n'
  + '-----END PRIVATE KEY-----';

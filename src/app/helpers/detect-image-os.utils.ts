import { AllowedImageOs, ImageOs } from 'app/enums/virtualization.enum';

export function detectImageOs(value: string | null | undefined): AllowedImageOs {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();

  const osMappings: { keywords: string[]; os: ImageOs }[] = [
    { keywords: ['win', 'windows'], os: ImageOs.Windows },
    { keywords: ['ubuntu', 'debian', 'fedora', 'centos', 'linux', 'arch', 'archlinux'], os: ImageOs.Linux },
    { keywords: ['freebsd', 'free bsd', 'bsd'], os: ImageOs.FreeBsd },
  ];

  for (const mapping of osMappings) {
    if (mapping.keywords.some((keyword) => normalized.includes(keyword))) {
      return mapping.os;
    }
  }

  return null;
}

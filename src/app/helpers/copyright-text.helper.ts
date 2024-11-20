export function getCopyrightText(isEnterprise: boolean, buildYear: number): string {
  if (isEnterprise) {
    return `TrueNAS ENTERPRISE ® © ${buildYear}`;
  }
  return `TrueNAS ® © ${buildYear}`;
}

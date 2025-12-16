import { EnclosureElement } from 'app/interfaces/enclosure.interface';

export function makeSasConnectors(from: number, to: number): Record<number, EnclosureElement> {
  const connectors: Record<number, EnclosureElement> = {};
  let slotIndex = 0;

  for (let i = from; i <= to; i++) {
    const paddedIndex = String(slotIndex).padStart(2, '0');
    // First and 7th connectors (indices 0 and 6) are OK, rest are "Not installed"
    const isInstalled = slotIndex === 0 || slotIndex === 6;

    connectors[i] = {
      descriptor: `CONN HOST ${paddedIndex}`,
      status: isInstalled ? 'OK' : 'Not installed',
      value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
      value_raw: isInstalled ? 17170304 : 84279040,
    };

    slotIndex++;
  }

  return connectors;
}

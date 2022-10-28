export interface ApiTimestamp {
  $date: number;
}

export interface ApiDate {
  $type: 'date';
  $value: string;
}

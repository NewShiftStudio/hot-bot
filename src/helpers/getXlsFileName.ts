import { format } from 'date-fns';

export function getXlsFileName() {
  const today = new Date();

  return format(today, 'dd-mm-yyyy');
}

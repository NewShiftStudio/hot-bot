import { format } from 'date-fns';

export function formatDateToIiko(dob: string) {
  const dobArr = dob.split('.');
  const date = +dobArr[0];
  const month = +dobArr[1] - 1;
  const year = +dobArr[2];

  const bodDate = new Date(Date.UTC(year, month, date));

  const formattedDate = format(bodDate, 'yyyy-MM-dd HH:mm:ss');
  return formattedDate + `.000`;
  //yyyy-MM-dd HH:mm:ss.fff
}

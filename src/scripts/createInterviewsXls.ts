import { Interview } from '../common/entities/Interview';
import { interviewService } from '../common/services/interview.service';
import { getUserCityString } from '../helpers/getUserCityString';

const ExcelJS = require('exceljs');
const AdmZip = require('adm-zip');

const token = process.env.USER_BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN must be provided!');
}

type Result = {
  status: 'success' | 'error';
  message: string;
};

export async function generateXls(fileName: string): Promise<Result> {
  const interviews = await interviewService.getAll({
    step: 'closed',
  });

  if (!interviews.length) {
    return {
      status: 'error',
      message: 'Нет результатов опросов',
    };
  }

  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet('Результаты опроса');
  worksheet.columns = [
    { header: 'ФИО', key: 'fullName', width: 20 },
    { header: 'Номер телефона', key: 'phoneNumber', width: 20 },
    { header: 'Город', key: 'city', width: 15 },
    { header: 'Дата заказа', key: 'lastOrderDate', width: 12 },
    { header: 'Блюда', key: 'dish', width: 10 },
    { header: 'Сервис', key: 'service', width: 10 },
    {
      header: 'Коктейльная карта',
      key: 'cocktailCard',
      width: 10,
    },
    { header: 'Чистота', key: 'purity', width: 10 },
  ];

  const rows = interviews.map(getInterviewRow);

  rows.forEach(row => {
    worksheet.addRow(row);
  });

  await workbook.xlsx.writeFile(
    process.env.PUBLIC_FOLDER + '/' + fileName + '.xlsx'
  );

  const zip = new AdmZip();
  zip.addLocalFile(process.env.PUBLIC_FOLDER + '/' + fileName + '.xlsx');
  zip.writeZip(process.env.PUBLIC_FOLDER + '/' + fileName + '.zip');

  return {
    status: 'success',
    message: 'Успешно!',
  };
}

function getInterviewRow(interview: Interview) {
  const { firstName, secondName, phoneNumber, city, lastOrderDate } =
    interview.user;

  const { dish, service, cocktailCard, purity } = interview;
  return {
    fullName: firstName + ' ' + secondName,
    phoneNumber,
    city: getUserCityString(city),
    lastOrderDate,
    dish,
    service,
    cocktailCard,
    purity,
  };
}

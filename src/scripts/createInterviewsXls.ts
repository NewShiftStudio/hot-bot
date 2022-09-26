import { Interview } from '../common/entities/Interview';
import { interviewService } from '../common/services/interview.service';
import { getUserCityString } from '../helpers/getUserCityString';
import path from 'node:path';

import * as ExcelJs from 'exceljs';

// eslint-disable-next-line
const AdmZip = require('adm-zip');

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

  const workbook = new ExcelJs.Workbook();

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

  rows.forEach((row) => {
    worksheet.addRow(row);
  });

  try {
    const xlsxPath = path.join(
      process.cwd(),
      'static',
      'xlsx',
      `${fileName}.xlsx`,
    );

    await workbook.xlsx.writeFile(xlsxPath);

    const zip = new AdmZip();
    await zip.addLocalFile(xlsxPath);
    await zip.writeZip(
      path.join(process.cwd(), 'static', 'zip', `${fileName}.zip`),
    );

    return {
      status: 'success',
      message: 'Успешно!',
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Ошибка генерации файла',
    };
  }
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

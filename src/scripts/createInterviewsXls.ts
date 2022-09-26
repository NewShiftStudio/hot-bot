import { Interview } from '../common/entities/Interview';
import { interviewService } from '../common/services/interview.service';
import { getUserCityString } from '../helpers/getUserCityString';
import path from 'node:path';
import fs from 'node:fs';

import * as ExcelJs from 'exceljs';
import { toBool } from '../helpers/toBool';

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
    const folderPathXlsx = path.join(process.cwd(), 'static', 'xlsx');
    const folderPathZip = path.join(process.cwd(), 'static', 'zip');

    const fileNameXlsx = `${fileName}.xlsx`;
    const fileNameZip = `${fileName}.zip`;

    const filePathXlsx = path.join(folderPathXlsx, fileNameXlsx);
    const filePathZip = path.join(folderPathXlsx, fileNameZip);

    const existsXlsx = await fs.promises.access(folderPathXlsx).then(...toBool);
    const existsZip = await fs.promises.access(folderPathZip).then(...toBool);

    if (!existsXlsx) {
      await fs.promises.mkdir(folderPathXlsx, { recursive: true });
    }
    if (!existsZip) {
      await fs.promises.mkdir(folderPathZip, { recursive: true });
    }

    await workbook.xlsx.writeFile(filePathXlsx);

    const zip = new AdmZip();
    await zip.addLocalFile(filePathXlsx);
    await zip.writeZip(path.join(filePathZip));

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

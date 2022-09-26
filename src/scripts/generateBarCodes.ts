import { toBuffer, ToBufferOptions } from 'bwip-js';
import * as fs from 'fs';
import path from 'node:path';
import list from '../../cards.json';
import { cardService } from '../common/services/card.service';
import { AppDataSource } from '../database/appDataSourse';
import { toBool } from '../helpers/toBool';
import { wait } from '../helpers/wait';

const cardsList = list as CardData[];

export type CardData = {
  cardTrack: string;
  cardNumber: string;
};

const barCodeOptions: Omit<ToBufferOptions, 'text'> = {
  bcid: 'code128',
  scale: 5,
  height: 10,
  includetext: true,
  textxalign: 'center',
  backgroundcolor: 'FFFFFF',
  paddingheight: 2,
  paddingwidth: 7,
};

export function generateBarCode(card: CardData) {
  console.info(card.cardNumber);

  const BAR_CODES_FOLDER = process.env.BAR_CODES_FOLDER || '';
  const STATIC_SERVER_URL = process.env.STATIC_SERVER_URL || '';

  const fullPath = path.join(process.cwd(), 'static', BAR_CODES_FOLDER);

  const fileName = `${card.cardNumber}.png`;

  toBuffer({ text: card.cardNumber, ...barCodeOptions }, async (error, img) => {
    if (error) {
      console.error(error);
    }

    const exists = await fs.promises.access(fullPath).then(...toBool);

    if (!exists) {
      await fs.promises.mkdir(fullPath, { recursive: true });
    }

    await fs.promises.writeFile(path.join(fullPath, fileName), img, {
      encoding: 'base64',
    });

    const fileLink = STATIC_SERVER_URL + path.join(BAR_CODES_FOLDER, fileName);

    cardService.create({
      cardNumber: card.cardNumber,
      cardTrack: card.cardTrack,
      barCodeLink: fileLink,
    });
  });
}

async function bootstrap() {
  try {
    await AppDataSource.initialize();

    console.log('data source initialized');
    for (let i = 0; i < cardsList.length; i++) {
      generateBarCode(cardsList[i]);
      await wait(50);
    }
  } catch (error) {
    console.log(error);
  }
}

bootstrap();

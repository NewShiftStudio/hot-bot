import { toBuffer, ToBufferOptions } from 'bwip-js';
import * as fs from 'fs';
import list from '../../cards.json';
import { cardService } from '../common/services/card.service';
import { AppDataSource } from '../database/appDataSourse';
import { wait } from '../helpers/wait';

const cardsList = list as CardData[];

export type CardData = {
  cardTrack: string;
  city: string;
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
  console.log(card.cardNumber);
  const fullPath = [
    process.env.PUBLIC_FOLDER,
    process.env.BAR_CODES_FOLDER,
    `${card.cardNumber}.png`,
  ].join('/');

  toBuffer({ text: card.cardNumber, ...barCodeOptions }, async (error, img) => {
    if (error) {
      console.log(error);
    }

    await fs.promises.writeFile(fullPath, img, {
      encoding: 'base64',
    });

    let city = card.city;
    if (city !== 'MSK' && city !== 'SPB') {
      city = 'SPB';
    }
    cardService.create({
      cardNumber: card.cardNumber,
      cardTrack: card.cardTrack,
      city,
      barCodeLink: fullPath,
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

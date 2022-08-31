import { toBuffer, ToBufferOptions } from 'bwip-js';
import * as fs from 'fs';
import list from '../../cards.json';
import { cardService } from '../common/services/card.service';
import { AppDataSource } from '../database/appDataSourse';

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
  console.log(card.cardNumber);
  const fullPath = [process.env.PUBLIC_FOLDER, process.env.BAR_CODES_FOLDER, `${card.cardNumber}.png`].join('/');

  toBuffer({ text: card.cardNumber, ...barCodeOptions }, async (error, img) => {
    if (error) {
      console.log(error);
    }
    await fs.promises.writeFile(fullPath, img, {
      encoding: 'base64',
    });

    cardService.create({
      cardNumber: card.cardNumber,
      cardTrack: card.cardTrack,
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
    }
  } catch (error) {
    console.log(error);
  }
}

bootstrap();

import { toBuffer, ToBufferOptions } from 'bwip-js';
import * as fs from 'fs';
import list from './../cards.json';
import { cardService } from './common/services/card.service';
import { AppDataSource } from './database/appDataSourse';

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
  const fullPath = `${process.env.PUBLIC_PATH}${process.env.BAR_CODES_FOLDER}/${card.cardNumber}.png`;
  toBuffer({ text: card.cardNumber, ...barCodeOptions }, (error, img) => {
    if (error) {
      console.log(error);
    }
    fs.writeFile(
      fullPath,
      img,
      {
        encoding: 'base64',
      },
      () => {}
    );

    cardService.create({
      cardNumber: card.cardNumber,
      cardTrack: card.cardTrack,
      barCodeLink: fullPath,
    });
  });
}

async function test() {
  try {
    await AppDataSource.initialize();

    console.log('data source initialized');
    for (let i = 0; i < 10; i++) {
      generateBarCode(cardsList[i]);
    }
  } catch (error) {
    console.log(error);
  }
}

test();

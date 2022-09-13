import { Repository } from 'typeorm';
import { Card } from '../entities/Card';
import { AppDataSource } from '../../database/appDataSourse';

import dotenv from 'dotenv';
dotenv.config();

class CardService {
  cardRepository: Repository<Card>;

  constructor() {
    this.cardRepository = AppDataSource.getRepository(Card);
  }

  async getAll(card?: Partial<Card>) {
    return await this.cardRepository.find({
      where: card,
      relations: ['user'],
    });
  }

  async getOne(id: number) {
    return await this.cardRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async getFreeCard() {
    const cardsList = await this.getAll();
    const freeCards = cardsList.filter((card) => !card.user);
    if (freeCards.length === 0) {
      console.log(`Свободные карты кончились`);
      throw new Error('Нет свободных карт');
    }
    return freeCards[0];
  }

  async create(card: Partial<Card>) {
    return await this.cardRepository.save(card);
  }

  async update(id: number, card: Partial<Card>) {
    return await this.cardRepository.update(id, card);
  }

  async delete(id: number) {
    return await this.cardRepository.delete(id);
  }
}

export const cardService = new CardService();

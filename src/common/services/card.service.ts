import { IsNull, Repository } from 'typeorm';
import { Card } from '../entities/Card';
import { AppDataSource } from '../../database/appDataSourse';

import dotenv from 'dotenv';
dotenv.config();

class CardService {
  cardRepository: Repository<Card>;

  constructor() {
    this.cardRepository = AppDataSource.getRepository(Card);
  }

  async getAll(card?: Partial<Card>card?: Partial<Card>) {
    return await this.cardRepository.find({
      where: card,
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
    const freeCard = await this.cardRepository.findOne({
      where: {
        user: IsNull(),
      },
    });
    if (!freeCard) {
      console.log(`Свободные карты кончились`);
      throw new Error('Нет свободных карт');
    }
    return freeCard;
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

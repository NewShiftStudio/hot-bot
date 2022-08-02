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

  async getAll() {
    return await this.cardRepository.find();
  }

  async getOne(id: number) {
    return await this.cardRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async getFreeCard() {
    const freeCards = await this.cardRepository.find({
      relations: {
        user: false,
      },
    });
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

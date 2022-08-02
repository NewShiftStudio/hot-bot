import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { AppDataSource } from '../../database/appDataSourse';
import { cardService } from './card.service';

class UserService {
  userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async create(user: Partial<User>) {
    return await this.userRepository.save(user);
  }

  async getByTelegramId(telegramId: number) {
    return await this.userRepository.findOne({
      where: {
        telegramId,
      },
      relations: ['card'],
    });
  }

  async findOneByPhone(phoneNumber: string) {
    return await this.userRepository.findOne({
      where: {
        phoneNumber,
      },
    });
  }

  async getAll() {
    return await this.userRepository.find();
  }

  async getById(id: number) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async setCard(id: number) {
    const user = await this.getById(id);
    if (!user) return;
    if (user.card) {
      return;
    }
    const card = await cardService.getFreeCard();
    user.card = card;
    return await this.userRepository.save(user);
  }

  async update(telegramId: number, user: Partial<User>) {
    return await this.userRepository.update({ telegramId }, user);
  }

  async delete(telegramId: number) {
    return await this.userRepository.delete({ telegramId });
  }
}

export const userService = new UserService();

import { Repository } from 'typeorm';

import dotenv from 'dotenv';
import { User } from '../entities/User';
import { AppDataSource } from '../../server';
dotenv.config();

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
    });
  }

  async getAll() {
    return await this.userRepository.find();
  }

  async update(telegramId: number, user: Partial<User>) {
    return await this.userRepository.update({ telegramId }, user);
  }

  async delete(telegramId: number) {
    return await this.userRepository.delete({ telegramId });
  }
}

export const userService = new UserService();

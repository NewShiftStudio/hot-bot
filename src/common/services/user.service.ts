import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { AppDataSource } from '../../database/appDataSourse';

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

  async update(telegramId: number, user: Partial<User>) {
    return await this.userRepository.update({ telegramId }, user);
  }

  async delete(telegramId: number) {
    return await this.userRepository.delete({ telegramId });
  }
}

export const userService = new UserService();

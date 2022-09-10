import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { AppDataSource } from '../../database/appDataSourse';
import { cardService } from './card.service';
import { interviewService } from './interview.service';
import { Interview } from '../entities/Interview';
import { CityStats } from '../entities/CityStats';

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
      relations: ['card', 'interviews'],
    });
  }

  async findOneByPhone(phoneNumber: string) {
    return await this.userRepository.findOne({
      where: {
        phoneNumber,
      },
    });
  }

  async getAll(user?: Partial<User>) {
    return await this.userRepository.find({
      where: user,
      relations: ['card', 'interviews'],
    });
  }

  async getAllWithInterview() {
    return await this.userRepository.find({
      where: {
        interviews: {
          step: 'created',
        },
      },
      relations: ['interviews'],
    });
  }

  async getCityStats(): Promise<CityStats> {
    const spdUser = await this.getAll({ city: 'SPB' });
    const moscowUser = await this.getAll({ city: 'MSK' });

    const total = spdUser.length + moscowUser.length;

    return {
      total,
      spb: spdUser.length,
      msk: moscowUser.length,
    };
  }

  async getById(id: number) {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['interviews'],
    });
  }

  async setCard(id: number) {
    const user = await this.getById(id);
    if (!user) return;
    if (user.card) {
      return;
    }
    const card = await cardService.getFreeCard();
    user.card = card;
    await cardService.update(card.id, { user });
    return await this.userRepository.save(user);
  }

  async addInterview(userId: number, interview: Interview) {
    const user = await this.getById(userId);
    if (!user) return;

    const userInterviews = user.interviews || [];
    userInterviews.push(interview);
    user.interviews = userInterviews;
    this.userRepository.save(user);
  }

  async update(telegramId: number, user: Partial<User>) {
    return await this.userRepository.update({ telegramId }, user);
  }

  async delete(telegramId: number) {
    return await this.userRepository.delete({ telegramId });
  }
}

export const userService = new UserService();

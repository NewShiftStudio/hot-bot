import { Repository } from 'typeorm';
import { AppDataSource } from '../../database/appDataSourse';
import { Interview } from '../entities/Interview';

import dotenv from 'dotenv';
import { userService } from './user.service';
dotenv.config();

class InterviewService {
  interviewRepository: Repository<Interview>;

  constructor() {
    this.interviewRepository = AppDataSource.getRepository(Interview);
  }

  async getAll(interview?: Partial<Interview>) {
    return await this.interviewRepository.find({
      where: interview,
      relations: ['user'],
    });
  }

  async getOne(id: number) {
    return await this.interviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async create(userId: number) {
    const user = await userService.getById(userId);
    if (!user) {
      throw Error('User not found');
    }

    const interview = this.interviewRepository.create({
      step: 'init',
      user,
    });
    await this.interviewRepository.save(interview);
    userService.update(user.telegramId, { interview });
    return interview;
  }

  async update(id: number, interview: Partial<Interview>) {
    return await this.interviewRepository.update(id, interview);
  }

  async delete(id: number) {
    return await this.interviewRepository.delete(id);
  }
}

export const interviewService = new InterviewService();

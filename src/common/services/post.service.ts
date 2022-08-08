import { Repository } from 'typeorm';

import { AppDataSource } from '../../database/appDataSourse';

import { Post } from '../entities/Post';
import dotenv from 'dotenv';
dotenv.config();

class PostService {
  postRepository: Repository<Post>;

  constructor() {
    this.postRepository = AppDataSource.getRepository(Post);
  }

  async getAll(post: Partial<Post>) {
    return await this.postRepository.find({
      where: post,
    });
  }

  async getOne(post: Partial<Post>) {
    return await this.postRepository.findOne({
      where: post,
    });
  }

  async create(post: Partial<Post>) {
    return await this.postRepository.save(post);
  }

  async update(creatorTelegramId: number, post: Partial<Post>) {
    return await this.postRepository.update({ creatorTelegramId }, post);
  }

  async delete(id: number) {
    return await this.postRepository.delete({ id });
  }

  async deleteByCreatorId(creatorTelegramId: number) {
    return await this.postRepository.delete({ creatorTelegramId });
  }
}

export const postService = new PostService();

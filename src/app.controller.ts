import { Body, Controller, Get, Post, Put, Param, Patch, NotFoundException, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { TokenDto } from './dto/token.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}

  @MessagePattern('authService.ping')
  handlePing() {
    return { status: 'ok' };
  }

  @MessagePattern({ service: 'auth-service', cmd: 'get-me' })
  async getMe(token: TokenDto) {
    const response = await this.appService.getUserByToken(token);
    console.log(token);
    return response;
  }

  @MessagePattern({ service: 'auth-service', cmd: 'register-user' })
  async register(createUserDto: CreateUserDto) {
    return this.appService.register(createUserDto);
  }

  @MessagePattern({ service: 'auth-service', cmd: 'login-user' })
  async login(loginDto: LoginDto) {
    return this.appService.login(loginDto);
  }

  @MessagePattern({ service: 'auth-service', cmd: 'get-user' })
  async getUser(id: string) {
    const user = await this.appService.getUserById(id);

    if (!user) {
      throw new RpcException(
        {
          code: 'user-not-found',
          message: 'User not found',
        }
      );
    }
    return user;
  }

  @MessagePattern({ service: 'auth-service', cmd: 'update-user' })
  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    return this.appService.updateUser(id, updateUserDto);
  }

  @MessagePattern({ service: 'auth-service', cmd: 'verify-token' })
  async verifyToken(token: TokenDto) {
    return this.appService.verifyToken(token);
  }
}

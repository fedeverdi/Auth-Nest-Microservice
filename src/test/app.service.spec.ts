import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from '../app.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { User } from '../models/user.model';
import * as bcrypt from 'bcryptjs';

describe('AppService', () => {
  let service: AppService;
  let mockUserModel: any;
  let mockJwtService: any;

  beforeEach(async () => {
    // Simulazione di un'istanza del modello
    const mockUserInstance = {
      save: jest.fn().mockResolvedValue({
        email: 'test@test.com',
        fullName: 'Test User',
        password: 'hashed-password',
      }),
    };

    // Simulazione del modello come costruttore
    mockUserModel = jest.fn(() => mockUserInstance);

    // Aggiunta di altri metodi al modello
    mockUserModel.findOne = jest.fn();
    mockUserModel.findById = jest.fn();
    mockUserModel.findByIdAndUpdate = jest.fn();
    mockUserModel.exists = jest.fn();

    // Mock del servizio JWT
    mockJwtService = {
      sign: jest.fn(() => 'mocked-token'),
      verify: jest.fn(() => ({ sub: 'mocked-email' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a user and return the saved user', async () => {
      const createUserDto = { email: 'test@test.com', password: 'password', fullName: 'Test User' };
      const hashedPassword = 'hashed-password';

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);
      mockUserModel.exists.mockResolvedValue(false);

      const result = await service.register(createUserDto);

      expect(result).toEqual({
        email: 'test@test.com',
        fullName: 'Test User',
        password: 'hashed-password',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(mockUserModel.exists).toHaveBeenCalledWith({ email: 'test@test.com' });
    });

    it('should throw RpcException if user already exists', async () => {
      const createUserDto = { email: 'test@test.com', password: 'password', fullName: 'Test User' };

      mockUserModel.exists.mockResolvedValue(true);

      await expect(service.register(createUserDto)).rejects.toThrow(RpcException);
    });
  });

  describe('login', () => {
    it('should return token and user on successful login', async () => {
      const loginDto = { email: 'test@test.com', password: 'password' };
      const user = { email: 'test@test.com', fullName: 'Test User', password: 'hashed-password' };

      mockUserModel.findOne.mockResolvedValue(user);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await service.login(loginDto);
      expect(result).toEqual({ token: 'mocked-token', user });
    });

    it('should throw RpcException if user not found', async () => {
      const loginDto = { email: 'test@test.com', password: 'password' };

      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(RpcException);
    });

    it('should throw RpcException if password is invalid', async () => {
      const loginDto = { email: 'test@test.com', password: 'wrongpassword' };
      const user = { email: 'test@test.com', fullName: 'Test User', password: 'hashed-password' };

      mockUserModel.findOne.mockResolvedValue(user);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(RpcException);
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const id = 'userId';
      const user = { email: 'test@test.com', fullName: 'Test User' };

      mockUserModel.findById.mockResolvedValue(user);

      const result = await service.getUserById(id);
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      const id = 'invalidId';

      mockUserModel.findById.mockResolvedValue(null);

      const result = await service.getUserById(id);
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      const id = 'userId';
      const updateUserDto = { fullName: 'Updated User' };
      const updatedUser = { email: 'test@test.com', fullName: 'Updated User' };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.updateUser(id, updateUserDto);
      expect(result).toEqual(updatedUser);
    });

    it('should throw RpcException if user not found', async () => {
      const id = 'invalidId';
      const updateUserDto = { fullName: 'Updated User' };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.updateUser(id, updateUserDto)).rejects.toThrow(RpcException);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user if found', async () => {
      const email = 'test@test.com';
      const user = { email: 'test@test.com', fullName: 'Test User' };

      mockUserModel.findOne.mockResolvedValue(user);

      const result = await service.getUserByEmail(email);
      expect(result).toEqual(user);
    });

    it('should throw RpcException if user not found', async () => {
      const email = 'test@test.com';

      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.getUserByEmail(email)).rejects.toThrow(RpcException);
    });
  });

  describe('getUserByToken', () => {
    it('should return user for valid token', async () => {
      const token = { token: 'valid-token' };
      const user = { email: 'mocked-email', fullName: 'Test User' };

      mockUserModel.findOne.mockResolvedValue(user);

      const result = await service.getUserByToken(token);
      expect(result).toEqual(user);
    });

    it('should throw RpcException for invalid token', async () => {
      const token = { token: 'invalid-token' };

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.getUserByToken(token)).rejects.toThrow(RpcException);
    });
  });

  describe('verifyToken', () => {
    it('should return user for valid token', async () => {
      const token = { token: 'valid-token' };
      const user = { email: 'mocked-email', fullName: 'Test User' };

      mockUserModel.findOne.mockResolvedValue(user);

      const result = await service.verifyToken(token);
      expect(result).toEqual(user);
    });

    it('should throw RpcException for invalid token', async () => {
      const token = { token: 'invalid-token' };

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyToken(token)).rejects.toThrow(RpcException);
    });
  });
});

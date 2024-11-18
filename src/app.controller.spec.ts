import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { TokenDto } from './dto/token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './models/user.model';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getUserByToken: jest.fn(),
            register: jest.fn(),
            login: jest.fn(),
            getUserById: jest.fn(),
            updateUser: jest.fn(),
            verifyToken: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  describe('handlePing', () => {
    it('should return { status: "ok" }', () => {
      expect(appController.handlePing()).toEqual({ status: 'ok' });
    });
  });

  describe('getMe', () => {
    it('should return a user for a valid token', async () => {
      const token: TokenDto = { token: 'valid-token' };
      const mockUser: User = { email: 'test@test.it', fullName: 'John Doe', isVerified: true, lastLogin: new Date(), password: 'password123' };

      jest.spyOn(appService, 'getUserByToken').mockResolvedValue(mockUser);

      await expect(appController.getMe(token)).resolves.toEqual(mockUser);
    });
  });

  describe('register', () => {
    it('should register a user and return it', async () => {
      const createUserDto: CreateUserDto = { fullName: 'John Doe', email: 'john@example.com', password: 'password123' };
      const mockUser: User = { email: 'test@test.it', fullName: 'John Doe', isVerified: true, lastLogin: new Date(), password: 'password123' };

      jest.spyOn(appService, 'register').mockResolvedValue(mockUser);

      await expect(appController.register(createUserDto)).resolves.toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should return a token for valid credentials', async () => {
      const loginDto: LoginDto = { email: 'john@example.com', password: 'password123' };
      const mockToken = { token: 'valid-token', user: { email: 'test@test.it', fullName: 'John Doe', isVerified: true, lastLogin: new Date(), password: 'password123' }};

      jest.spyOn(appService, 'login').mockResolvedValue(mockToken);

      await expect(appController.login(loginDto)).resolves.toEqual(mockToken);
    });
  });

  describe('getUser', () => {
    it('should return a user by ID', async () => {
      const userId = '123';
      const mockUser: User = { email: 'test@test.it', fullName: 'John Doe', isVerified: true, lastLogin: new Date(), password: 'password123' };

      jest.spyOn(appService, 'getUserById').mockResolvedValue(mockUser);

      await expect(appController.getUser(userId)).resolves.toEqual(mockUser);
    });

    it('should throw RpcException if user not found', async () => {
      const userId = 'non-existent-id';

      jest.spyOn(appService, 'getUserById').mockResolvedValue(null);

      await expect(appController.getUser(userId)).rejects.toThrow(
        new RpcException({ code: 'user-not-found', message: 'User not found' }),
      );
    });
  });

  describe('updateUser', () => {
    it('should update a user and return it', async () => {
      const userId = '123';
      const updateUserDto: UpdateUserDto = { fullName: 'Updated Name', email: 'updated@example.com' };
      const mockUser: User = { email: 'test@test.it', fullName: 'John Doe', isVerified: true, lastLogin: new Date(), password: 'password123' };

      jest.spyOn(appService, 'updateUser').mockResolvedValue(mockUser);

      await expect(appController.updateUser(userId, updateUserDto)).resolves.toEqual(mockUser);
    });
  });

  describe('verifyToken', () => {
    it('should return true for a valid token', async () => {
      const token: TokenDto = { token: 'valid-token' };
      const mockUser: User = { email: 'test@test.it', fullName: 'John Doe', isVerified: true, lastLogin: new Date(), password: 'password123' };
      jest.spyOn(appService, 'verifyToken').mockResolvedValue(mockUser);

      await expect(appController.verifyToken(token)).resolves.toEqual(mockUser);
    });
  });
});

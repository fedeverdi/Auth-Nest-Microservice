import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './models/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { TokenDto } from './dto/token.dto';

@Injectable()
export class AppService {

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService
  ) {}

  // Registrazione di un nuovo utente
  async register(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, fullName } = createUserDto;

    // Verifica che l'utente non esista già
    const existingUser = await this.userModel.exists({ email });
    if (existingUser) {
      throw new RpcException(
        {
          code: 'user-already-exists',
          message: 'User already exists',
        }
      );
    }

    // Genera un hash della password con 10 salt rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea un nuovo utente
    const user = new this.userModel({ email, password: hashedPassword, fullName });
    return user.save();
  }

  // Login utente
  async login(loginDto: LoginDto): Promise<{ token: string; user: User }> {
    const { email, password } = loginDto;

    // Trova l'utente con l'email specificata
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new RpcException({
        code: 'invalid-credentials',
        message: 'Invalid credentials',
      });
    }

    // Confronta la password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new RpcException({
        code: 'invalid-credentials',
        message: 'Invalid credentials',
      });
    }

    // Genera un token (es. JWT)
    const token = this.generateToken(user);

    return { token, user };
  }

  // Ottieni un utente per ID
  async getUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  // Aggiorna i dati di un utente
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
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

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec(); // Cerca l'utente tramite email
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

  // Metodo per ottenere un utente tramite token
  async getUserByToken(token: TokenDto): Promise<User> {
    try {
      if(!token.token) {
        throw new RpcException(
          {
            code: 'missing-token',
            message: 'Missing token',
          }
        );
      }
      const decoded = this.jwtService.verify(token.token);
      return this.getUserByEmail(decoded.sub);
    } catch (error) {
      throw new RpcException(
        {
          code: 'invalid-token',
          message: 'Invalid token',
        }
      );
    }
  }

  // Metodo privato per generare un token
  private generateToken(user: User): string {
    const payload = { sub: user.email };
    return this.jwtService.sign(payload);
  }

  // Metodo per verificare un token
  async verifyToken(token: TokenDto): Promise<User> {
    try {
      if(!token.token) {
        throw new RpcException(
          {
            code: 'missing-token',
            message: 'Missing token',
          }
        );
      }
      const decoded = this.jwtService.verify(token.token);
      return this.getUserByEmail(decoded.sub);
    } catch (error) {
      throw new RpcException(
        {
          code: 'invalid-token',
          message: 'Invalid token',
        }
      );
    }
  }
}

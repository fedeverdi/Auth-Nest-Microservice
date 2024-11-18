import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ default: false })
  isVerified: boolean; // Indica se l'email dell'utente è verificata

  @Prop({ default: null })
  lastLogin?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

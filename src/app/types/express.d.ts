import { JwtPayload } from ".";
import { IUser } from "../modules/auth/auth.interface";
export {};

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export type TIdParam = {
  id: string;
};

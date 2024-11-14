import { PrismaClient } from "@prisma/client";
import { Logger } from "pino";
import { Client } from "stytch";
import { UserSessionStorage } from "./services/user-session.server";

export interface Context {
  pino: Logger
  prisma: PrismaClient,
  stytch: Client,
  userSessionStorage: UserSessionStorage,
}

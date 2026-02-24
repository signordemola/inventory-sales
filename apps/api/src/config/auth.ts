import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { multiSession } from 'better-auth/plugins';

import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const isSecure = process.env.BETTER_AUTH_URL?.startsWith('https://') ?? false;
const isProduction = process.env.NODE_ENV === 'production';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
      },
      businessId: {
        type: 'string',
        required: false,
      },
      isActive: {
        type: 'boolean',
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 24 * 60 * 60,
      strategy: 'jwt',
    },
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    storeSessionInDatabase: true,
  },
  trustedOrigins: isProduction
    ? [process.env.FRONTEND_URL]
    : [
        'http://localhost:3000',
        'http://localhost:4000',
        'https://hottish-lyrically-kristopher.ngrok-free.dev',
      ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  rateLimit: {
    enabled: true,
    storage: 'secondary-storage',
    window: 10,
    max: 100,
  },
  advanced: {
    cookies: {
      session_token: {
        name: 'inventory_sales',
        attributes: {
          sameSite: 'lax',
          secure: isSecure,
          httpOnly: true,
          path: '/',
        },
      },
    },
  },
  plugins: [
    multiSession({
      maximumSessions: 3,
    }),
  ],
});

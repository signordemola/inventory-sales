import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { auth } from '../src/config/auth';
import { UserRole } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Default Business (checked by name for idempotency since ID is auto-generated)
  let business = await prisma.business.findFirst({
    where: { name: 'NaijaStock HQ' },
  });

  if (!business) {
    business = await prisma.business.create({
      data: {
        name: 'NaijaStock HQ',
        email: 'hq@naijastock.com',
        currency: 'NGN',
        address: 'Lagos, Nigeria',
        phone: '+2348000000000',
      },
    });
    console.log(`✅ Business created: ${business.name}`);
  } else {
    console.log(`ℹ️ Business already exists: ${business.name}`);
  }

  // 2. Create Owner User via Better Auth API
  const ownerEmail = 'adedamola4678@gmail.com';
  const ownerPassword = 'SecurePass123!';

  const existingUser = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  if (!existingUser) {
    const response = await auth.api.signUpEmail({
      body: {
        email: ownerEmail,
        password: ownerPassword,
        name: 'Abbey White',
      },
    });

    if (response) {
      // 3. Update User role and link to Business
      await prisma.user.update({
        where: { email: ownerEmail },
        data: {
          role: UserRole.OWNER,
          businessId: business.id,
          isActive: true,
        },
      });
      console.log(`✅ Owner created: ${ownerEmail} / ${ownerPassword}`);
    }
  } else {
    // Ensure the existing user has the correct role and business
    await prisma.user.update({
      where: { email: ownerEmail },
      data: {
        role: UserRole.OWNER,
        businessId: business.id,
      },
    });
    console.log(`ℹ️ Owner already exists: ${ownerEmail}`);
  }

  console.log('🏁 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

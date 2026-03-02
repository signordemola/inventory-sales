import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { auth } from './config/auth';
import { UsersModule } from './modules/users/users.module';
import { BusinessModule } from './modules/business/business.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertsModule } from './modules/alerts/alerts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RequestLoggerMiddleware } from './common/middlewares/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', cache: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get('THROTTLE_TTL', 60000),
          limit: config.get('THROTTLE_LIMIT', 10),
          blockDuration: config.get('THROTTLE_BLOCK', 60000),
        },
      ],
    }),
    AuthModule.forRoot({
      auth,
      middleware: (req, _res, next) => {
        req.url = req.originalUrl;
        req.baseUrl = '';
        next();
      },
    }),
    PrismaModule,
    UsersModule,
    BusinessModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    SalesModule,
    SuppliersModule,
    DashboardModule,
    CustomersModule,
    ScheduleModule.forRoot(),
    AlertsModule,
    NotificationsModule,
    ShiftsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}

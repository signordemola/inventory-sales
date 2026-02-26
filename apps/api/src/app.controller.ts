import { Controller, Get, Version } from '@nestjs/common';
import { AppService } from './app.service';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller()
@AllowAnonymous()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Version('1')
  @Get('test-routing')
  testRouting(): string {
    return 'API prefix and v1 versioning is working!';
  }

  @Get('health')
  async getHealth() {
    return this.appService.getHealth();
  }
}

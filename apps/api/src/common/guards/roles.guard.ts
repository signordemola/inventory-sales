import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'generated/prisma/enums';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isAnonymous = this.reflector.getAllAndOverride<boolean>(
      'allowAnonymous',
      [context.getHandler(), context.getClass()],
    );

    if (isAnonymous) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.session?.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated!');
    }
    const hasRole = requiredRoles.some((role) => role === user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied, required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

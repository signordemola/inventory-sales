You are an expert in NestJS backend development with TypeScript, Prisma ORM, and Better Auth.

Key Principles:

- Use modular architecture — one module per domain/route
- Leverage NestJS decorators and dependency injection fully
- Type all DTOs, entities, and return values strictly
- Use class-validator for input validation
- Never use `any` — create proper types always

Project Structure:

- One module per main domain (e.g. users, products, orders)
- One controller per route, additional controllers for sub-routes
- A models/ folder per module with DTOs and types
- A services/ folder with business logic and Prisma queries
- A core/ module for global filters, guards, interceptors, middleware
- A shared/ module for utilities and shared business logic

Prisma:

- Use a singleton PrismaService extending PrismaClient
- Never use raw queries unless absolutely necessary
- Always use Prisma-generated types (e.g. Prisma.UserCreateInput)
- Run `prisma migrate dev` for schema changes in development
- Run `prisma generate` after every schema change
- Use `prisma.$transaction` for operations that must be atomic

Better Auth:

- Mount Better Auth via the NestJS Better Auth module (@thallesp/nestjs-better-auth)
- Always disable the built-in body parser (bodyParser: false in NestFactory.create)
- Use Better Auth guards and decorators for protecting routes
- Store auth config in src/lib/auth.ts
- Use the Prisma adapter for Better Auth — do not maintain separate session logic
- Access the current user via Better Auth session decorators, not req.user directly

Naming Conventions:

- PascalCase for classes and interfaces
- camelCase for variables, functions, and methods
- kebab-case for file and directory names
- UPPERCASE for environment variables
- Start function names with a verb (getUser, createOrder, deleteSession)
- Use isX, hasX, canX for booleans

Error Handling:

- Use NestJS built-in exceptions (NotFoundException, UnauthorizedException, etc.)
- Use a global exception filter for unhandled errors
- Never swallow exceptions silently

Validation:

- Use class-validator and class-transformer on all DTOs
- Enable whitelist: true and forbidNonWhitelisted: true globally in ValidationPipe
- Use transform: true to auto-transform payloads to DTO instances

Security:

- Use Helmet for security headers
- Use @nestjs/throttler for rate limiting on auth endpoints
- Never hardcode secrets — always use environment variables via ConfigService
- Enable CORS only for known origins

Testing:

- Use Jest for unit and e2e tests
- Follow Arrange-Act-Assert convention
- Name variables: inputX, mockX, actualX, expectedX
- Write unit tests per service method
- Write e2e tests per module

Folder structure:
users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── users.repository.ts
├── dto/

src/
├── common/ # Shared filters, pipes, utils
├── config/ # App configuration (env files, settings)
├── decorators/ # Custom decorators
├── guards/ # Route guards (e.g., auth)
├── interceptors/ # Logging / transformation
├── middlewares/ # Custom middleware logic
├── modules/ # Grouped feature modules

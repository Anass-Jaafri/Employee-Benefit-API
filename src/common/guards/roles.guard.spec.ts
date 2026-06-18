import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from 'src/users/user.entity';

// Helper to build a minimal ExecutionContext mock
function buildContext(
  role: UserRole | null,
  handlerRoles?: UserRole[],
): ExecutionContext {
  return {
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: role ? { role } : {},
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('allows access when no roles are required (public endpoint)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined); // no @Roles() decorator
    const context = buildContext(null);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when user role matches a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.ADMIN,
      UserRole.HR_MANAGER,
    ]);
    const context = buildContext(UserRole.HR_MANAGER);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when user role does not match any required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = buildContext(UserRole.EMPLOYEE);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies access for employee trying to reach admin-only route', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = buildContext(UserRole.EMPLOYEE);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows admin to access admin-only route', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = buildContext(UserRole.ADMIN);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies hr_manager when only employee role is required', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.EMPLOYEE]);
    const context = buildContext(UserRole.HR_MANAGER);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('uses both handler and class metadata via getAllAndOverride', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = buildContext(UserRole.ADMIN);

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
      expect.anything(), // handler
      expect.anything(), // class
    ]);
  });
});

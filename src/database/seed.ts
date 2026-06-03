import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';
import { Employee } from '../employees/employee.entity';
import { Company } from '../companies/companies.entity';
import {
  BenefitPackage,
  PerkType,
} from '../benefit-packages/benefit-package.entity';
import { Claim, ClaimStatus, ClaimType } from '../claims/claim.entity';
import { EmploymentStatus } from '../employees/employee.entity';

// ─── Data-source ─────────────────────────────────────────────────────────────
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Employee, Company, BenefitPackage, Claim],
  synchronize: false,
});

const hash = (pw: string) => bcrypt.hash(pw, 12);
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD ?? 'dev-password';

// ─── Seed data ───────────────────────────────────────────────────────────────

const COMPANIES = [
  {
    name: 'Acme Corp',
    industry: 'Manufacturing',
    employeeCount: 24,
    domain: 'acme.com',
    isActive: true,
  },
  {
    name: 'TechNova Solutions',
    industry: 'Software & Technology',
    employeeCount: 50,
    domain: 'technova.io',
    isActive: true,
  },
  {
    name: 'HealthFirst Group',
    industry: 'Healthcare',
    employeeCount: 40,
    domain: 'healthfirst.org',
    isActive: true,
  },
];
const ADMIN = {
  email: 'admin@benefitflow.dev',
  firstName: 'Alex',
  lastName: 'Rivera',
  role: UserRole.ADMIN,
};

const HR_MANAGERS = [
  {
    email: 'hr@acme.com',
    firstName: 'Sandra',
    lastName: 'Okafor',
    companyIndex: 1,
  },
  {
    email: 'hr@technova.io',
    firstName: 'Marcus',
    lastName: 'Chen',
    companyIndex: 2,
  },
  {
    email: 'hr@healthfirst.org',
    firstName: 'Priya',
    lastName: 'Nair',
    companyIndex: 3,
  },
];

const EMPLOYEES = [
  // Acme Corp (1)
  {
    email: 'tom.bradley@acme.com',
    firstName: 'Tom',
    lastName: 'Bradley',
    jobTitle: 'Mechanical Engineer',
    companyIndex: 1,
  },
  {
    email: 'lisa.grant@acme.com',
    firstName: 'Lisa',
    lastName: 'Grant',
    jobTitle: 'Production Supervisor',
    companyIndex: 1,
  },
  {
    email: 'james.osei@acme.com',
    firstName: 'James',
    lastName: 'Osei',
    jobTitle: 'Quality Analyst',
    companyIndex: 1,
  },
  {
    email: 'yuki.tanaka@acme.com',
    firstName: 'Yuki',
    lastName: 'Tanaka',
    jobTitle: 'Logistics Coordinator',
    companyIndex: 1,
  },

  // TechNova Solutions (2)
  {
    email: 'diana.wolf@technova.io',
    firstName: 'Diana',
    lastName: 'Wolf',
    jobTitle: 'Senior Engineer',
    companyIndex: 2,
  },
  {
    email: 'carlos.m@technova.io',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    jobTitle: 'Product Manager',
    companyIndex: 2,
  },
  {
    email: 'aisha.k@technova.io',
    firstName: 'Aisha',
    lastName: 'Kamara',
    jobTitle: 'UX Designer',
    companyIndex: 2,
  },
  {
    email: 'ben.foster@technova.io',
    firstName: 'Ben',
    lastName: 'Foster',
    jobTitle: 'DevOps Engineer',
    companyIndex: 2,
  },
  {
    email: 'nina.patel@technova.io',
    firstName: 'Nina',
    lastName: 'Patel',
    jobTitle: 'Data Scientist',
    companyIndex: 2,
  },

  // HealthFirst Group (3)
  {
    email: 'dr.reyes@healthfirst.org',
    firstName: 'Sofia',
    lastName: 'Reyes',
    jobTitle: 'Clinical Director',
    companyIndex: 3,
  },
  {
    email: 'mark.burns@healthfirst.org',
    firstName: 'Mark',
    lastName: 'Burns',
    jobTitle: 'Nurse Practitioner',
    companyIndex: 3,
  },
  {
    email: 'emma.liu@healthfirst.org',
    firstName: 'Emma',
    lastName: 'Liu',
    jobTitle: 'Medical Administrator',
    companyIndex: 3,
  },
  {
    email: 'omar.hassan@healthfirst.org',
    firstName: 'Omar',
    lastName: 'Hassan',
    jobTitle: 'Pharmacist',
    companyIndex: 3,
  },

  // Unassigned — simulates the fallback path (contractor / generic email)
  {
    email: 'freelancer@gmail.com',
    firstName: 'Jordan',
    lastName: 'Kim',
    jobTitle: null,
    companyIndex: null,
  },
];

// ─── BENEFIT_PACKAGES data ───────────────────────────────────────────
const BENEFIT_PACKAGES = [
  // Acme Corp (1)
  {
    name: 'Acme Standard Care',
    description:
      'Core health insurance and meal vouchers for all full-time staff.',
    maxBenefitAmount: 5000.0,
    isActive: true,
    companyIndex: 1,
    perks: [PerkType.HEALTH_INSURANCE, PerkType.MEAL_VOUCHER],
  },
  {
    name: 'Acme Wellness Plus',
    description:
      'Enhanced package with gym membership and transport allowance.',
    maxBenefitAmount: 8000.0,
    isActive: true,
    companyIndex: 1,
    perks: [
      PerkType.HEALTH_INSURANCE,
      PerkType.MEAL_VOUCHER,
      PerkType.GYM_MEMBERSHIP,
      PerkType.TRANSPORT,
    ],
  },
  // TechNova Solutions (2)
  {
    name: 'TechNova Core',
    description: 'Standard health insurance with meal vouchers for all staff.',
    maxBenefitAmount: 6000.0,
    isActive: true,
    companyIndex: 2,
    perks: [PerkType.HEALTH_INSURANCE, PerkType.MEAL_VOUCHER],
  },
  {
    name: 'TechNova Premium',
    description:
      'Full suite — health, gym, transport, and remote work stipend.',
    maxBenefitAmount: 12000.0,
    isActive: true,
    companyIndex: 2,
    perks: [
      PerkType.HEALTH_INSURANCE,
      PerkType.GYM_MEMBERSHIP,
      PerkType.TRANSPORT,
      PerkType.REMOTE_WORK,
    ],
  },
  {
    name: 'TechNova Remote Stipend',
    description: 'Home office and internet allowance for remote employees.',
    maxBenefitAmount: 3000.0,
    isActive: false,
    companyIndex: 2,
    perks: [PerkType.REMOTE_WORK],
  },
  // HealthFirst Group (3)
  {
    name: 'HealthFirst Professional',
    description: 'Comprehensive coverage for healthcare professionals.',
    maxBenefitAmount: 9000.0,
    isActive: true,
    companyIndex: 3,
    perks: [
      PerkType.HEALTH_INSURANCE,
      PerkType.MEAL_VOUCHER,
      PerkType.GYM_MEMBERSHIP,
    ],
  },
  {
    name: 'HealthFirst Basic',
    description: 'Entry-level health coverage for part-time staff.',
    maxBenefitAmount: 3500.0,
    isActive: true,
    companyIndex: 3,
    perks: [PerkType.HEALTH_INSURANCE],
  },

  // HealthFirst Group (3)
  {
    name: 'HealthFirst Professional',
    description: 'Comprehensive coverage for healthcare professionals.',
    maxBenefitAmount: 3500.0,
    isActive: true,
    companyIndex: 3,
    perks: [
      PerkType.HEALTH_INSURANCE,
      PerkType.MEAL_VOUCHER,
      PerkType.GYM_MEMBERSHIP,
    ],
  },
  {
    name: 'HealthFirst Basic',
    description: 'Entry-level health coverage for part-time staff.',
    maxBenefitAmount: 9000.0,
    isActive: true,
    companyIndex: 3,
    perks: [PerkType.HEALTH_INSURANCE],
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────
async function seed() {
  await AppDataSource.initialize();
  console.log('✓ Connected to database');

  // ── 1. Wipe in FK-safe order ─────────────────────────────────────────────
  const tableNames = AppDataSource.entityMetadatas
    .map((m) => `"${m.tableName}"`)
    .join(', ');

  await AppDataSource.query(
    `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`,
  );
  console.log('✓ All tables cleared');

  const pw = await hash(DEFAULT_PASSWORD);

  // ── 2. Companies ─────────────────────────────────────────────────────────
  const companyRepo = AppDataSource.getRepository(Company);
  const savedCompanies = await companyRepo.save(
    COMPANIES.map((c) => companyRepo.create(c)),
  );
  console.log(`✓ ${savedCompanies.length} companies created`);

  // Helper — companyIndex is 1-based (mirrors DB id after RESTART IDENTITY)
  const company = (index: number) => savedCompanies[index - 1];

  // ── 3. Admin ─────────────────────────────────────────────────────────────
  const userRepo = AppDataSource.getRepository(User);
  await userRepo.save(userRepo.create({ ...ADMIN, password: pw }));
  console.log('✓ Admin created  (admin@benefitflow.dev / Password123)');

  // ── 4. HR managers ───────────────────────────────────────────────────────
  const employeeRepo = AppDataSource.getRepository(Employee);
  const savedHRs: Employee[] = [];

  for (const hr of HR_MANAGERS) {
    const user = await userRepo.save(
      userRepo.create({
        email: hr.email,
        password: pw,
        role: UserRole.HR_MANAGER,
      }),
    );
    const employee = await employeeRepo.save(
      employeeRepo.create({
        email: hr.email,
        firstName: hr.firstName,
        lastName: hr.lastName,
        jobTitle: 'HR Manager',
        status: EmploymentStatus.ACTIVE,
        user,
        company: company(hr.companyIndex),
      }),
    );
    savedHRs.push(employee);
  }
  console.log(`✓ ${savedHRs.length} HR managers created`);

  // ── 5. Employees ─────────────────────────────────────────────────────────
  const savedEmployees: Employee[] = [];

  for (const emp of EMPLOYEES) {
    const user = await userRepo.save(
      userRepo.create({
        email: emp.email,
        password: pw,
        role: UserRole.EMPLOYEE,
      }),
    );
    const employee = await employeeRepo.save(
      employeeRepo.create({
        email: emp.email,
        firstName: emp.firstName,
        lastName: emp.lastName,
        jobTitle: emp.jobTitle ?? undefined,
        status: EmploymentStatus.ACTIVE,
        user,
        company:
          emp.companyIndex !== null ? company(emp.companyIndex) : undefined,
      }),
    );
    savedEmployees.push(employee);
  }
  console.log(
    `✓ ${savedEmployees.length} employees created (${savedEmployees.filter((e) => !e.company).length} unassigned)`,
  );

  // ── 6. Benefit packages ──────────────────────────────────────────────────
  const packageRepo = AppDataSource.getRepository(BenefitPackage);
  const savedPackages = await packageRepo.save(
    BENEFIT_PACKAGES.map((p) =>
      packageRepo.create({
        name: p.name,
        description: p.description,
        maxBenefitAmount: p.maxBenefitAmount,
        perks: p.perks,
        isActive: p.isActive,
        company: company(p.companyIndex),
      }),
    ),
  );
  console.log(`✓ ${savedPackages.length} benefit packages created`);

  // ── 7. Enrollments ───────────────────────────────────────────────────────
  // Package indices are 0-based (savedPackages array order)
  const acmeStd = savedPackages[0]; // Acme Standard Care
  const acmeWell = savedPackages[1]; // Acme Wellness Plus
  const techCore = savedPackages[2]; // TechNova Core
  const techPrem = savedPackages[3]; // TechNova Premium
  const hfProf = savedPackages[5]; // HealthFirst Professional
  const hfBasic = savedPackages[6]; // HealthFirst Basic

  const enrollments: { employee: Employee; pkg: BenefitPackage }[] = [
    // Acme — split between standard and wellness
    { employee: savedEmployees[0], pkg: acmeStd },
    { employee: savedEmployees[1], pkg: acmeWell },
    { employee: savedEmployees[2], pkg: acmeStd },
    { employee: savedEmployees[3], pkg: acmeWell },
    // TechNova — engineers on premium, others on core
    { employee: savedEmployees[4], pkg: techPrem },
    { employee: savedEmployees[5], pkg: techCore },
    { employee: savedEmployees[6], pkg: techCore },
    { employee: savedEmployees[7], pkg: techPrem },
    { employee: savedEmployees[8], pkg: techCore },
    // HealthFirst — clinical on professional, admin on basic
    { employee: savedEmployees[9], pkg: hfProf },
    { employee: savedEmployees[10], pkg: hfProf },
    { employee: savedEmployees[11], pkg: hfBasic },
    { employee: savedEmployees[12], pkg: hfProf },
  ];

  for (const { employee, pkg } of enrollments) {
    const full = await employeeRepo.findOne({
      where: { id: employee.id },
      relations: ['benefitPackages'],
    });
    full!.benefitPackages = [...(full!.benefitPackages ?? []), pkg];
    await employeeRepo.save(full!);
  }
  console.log(`✓ ${enrollments.length} enrollments created`);

  // ── 8. Claims ────────────────────────────────────────────────────────────
  const claimRepo = AppDataSource.getRepository(Claim);

  const claimsData = [
    // Acme — Tom Bradley (Standard Care)
    {
      employee: savedEmployees[0],
      pkg: acmeStd,
      title: 'Eye exam',
      description: 'Annual eye exam + frames',
      claimType: ClaimType.MEDICAL,
      amount: 320.0,
      status: ClaimStatus.PAID,
      rejectionReason: null,
    },
    {
      employee: savedEmployees[0],
      pkg: acmeStd,
      title: 'Prescription refill',
      description: 'Prescription refill — Q2',
      claimType: ClaimType.MEDICAL,
      amount: 85.5,
      status: ClaimStatus.APPROVED,
      rejectionReason: null,
    },
    {
      employee: savedEmployees[0],
      pkg: acmeStd,
      title: 'Specialist visit',
      description: 'Specialist consultation',
      claimType: ClaimType.MEDICAL,
      amount: 950.0,
      status: ClaimStatus.PENDING,
      rejectionReason: null,
    },

    // Acme — Lisa Grant (Wellness Plus)
    {
      employee: savedEmployees[1],
      pkg: acmeWell,
      title: 'Gym membership',
      description: 'Annual gym membership',
      claimType: ClaimType.GYM,
      amount: 499.0,
      status: ClaimStatus.PAID,
      rejectionReason: null,
    },
    {
      employee: savedEmployees[1],
      pkg: acmeWell,
      title: 'Transport allowance',
      description: 'Transport allowance — Q1',
      claimType: ClaimType.TRANSPORT,
      amount: 250.0,
      status: ClaimStatus.APPROVED,
      rejectionReason: null,
    },
    {
      employee: savedEmployees[1],
      pkg: acmeWell,
      title: 'Medical equipment',
      description: 'Medical equipment purchase',
      claimType: ClaimType.MEDICAL,
      amount: 800.0,
      status: ClaimStatus.REJECTED,
      rejectionReason: 'Not covered under current plan.',
    },

    // TechNova — Diana Wolf (Premium)
    {
      employee: savedEmployees[4],
      pkg: techPrem,
      title: 'Remote work setup',
      description: 'Home office equipment stipend',
      claimType: ClaimType.OTHER,
      amount: 600.0,
      status: ClaimStatus.PAID,
      rejectionReason: null,
    },
    {
      employee: savedEmployees[4],
      pkg: techPrem,
      title: 'Annual transport pass',
      description: 'Transport pass — annual',
      claimType: ClaimType.TRANSPORT,
      amount: 350.0,
      status: ClaimStatus.PENDING,
      rejectionReason: null,
    },

    // TechNova — Carlos Mendoza (Core)
    {
      employee: savedEmployees[5],
      pkg: techCore,
      title: 'GP consultation',
      description: 'GP consultation + blood work',
      claimType: ClaimType.MEDICAL,
      amount: 180.0,
      status: ClaimStatus.APPROVED,
      rejectionReason: null,
    },
    {
      employee: savedEmployees[5],
      pkg: techCore,
      title: 'Health insurance',
      description: 'Health insurance top-up',
      claimType: ClaimType.MEDICAL,
      amount: 420.0,
      status: ClaimStatus.PENDING,
      rejectionReason: null,
    },

    // TechNova — Ben Foster (Premium)
    {
      employee: savedEmployees[7],
      pkg: techPrem,
      title: 'Home office setup',
      description: 'Remote work — home office setup',
      claimType: ClaimType.OTHER,
      amount: 750.0,
      status: ClaimStatus.PAID,
      rejectionReason: null,
    },

    // HealthFirst — Dr. Reyes (Professional)
    {
      employee: savedEmployees[9],
      pkg: hfProf,
      title: 'Gym membership',
      description: 'Annual gym membership',
      claimType: ClaimType.GYM,
      amount: 420.0,
      status: ClaimStatus.APPROVED,
      rejectionReason: null,
    },
    {
      employee: savedEmployees[9],
      pkg: hfProf,
      title: 'Meal voucher top-up',
      description: 'Meal voucher replenishment',
      claimType: ClaimType.MEAL,
      amount: 110.0,
      status: ClaimStatus.PAID,
      rejectionReason: null,
    },

    // HealthFirst — Mark Burns (Professional)
    {
      employee: savedEmployees[10],
      pkg: hfProf,
      title: 'Specialist referral',
      description: 'Specialist referral visit',
      claimType: ClaimType.MEDICAL,
      amount: 980.0,
      status: ClaimStatus.PENDING,
      rejectionReason: null,
    },
    {
      employee: savedEmployees[10],
      pkg: hfProf,
      title: 'Transport allowance',
      description: 'Transport allowance — Q1',
      claimType: ClaimType.TRANSPORT,
      amount: 60.0,
      status: ClaimStatus.PAID,
      rejectionReason: null,
    },

    // HealthFirst — Emma Liu (Basic)
    {
      employee: savedEmployees[11],
      pkg: hfBasic,
      title: 'GP visits',
      description: 'GP visit × 3',
      claimType: ClaimType.MEDICAL,
      amount: 210.0,
      status: ClaimStatus.APPROVED,
      rejectionReason: null,
    },
    {
      employee: savedEmployees[11],
      pkg: hfBasic,
      title: 'Inpatient procedure',
      description: 'Inpatient procedure',
      claimType: ClaimType.MEDICAL,
      amount: 1800.0,
      status: ClaimStatus.REJECTED,
      rejectionReason: 'Exceeds basic plan annual limit.',
    },
  ];

  await claimRepo.save(
    claimsData.map(
      ({
        employee,
        pkg,
        title,
        description,
        claimType,
        amount,
        status,
        rejectionReason,
      }) =>
        claimRepo.create({
          employee,
          benefitPackage: pkg,
          title,
          description,
          claimType,
          amount,
          status,
          rejectionReason,
        }),
    ),
  );
  console.log(`✓ ${claimsData.length} claims created`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n── Seed complete ───────────────────────────────────────');
  console.log('  All passwords: Password123\n');
  console.log('  Admin          admin@benefitflow.dev');
  console.log('  HR — Acme      hr@acme.com');
  console.log('  HR — TechNova  hr@technova.io');
  console.log('  HR — Health    hr@healthfirst.org');
  console.log('\n  Employees:');
  EMPLOYEES.forEach((e) =>
    console.log(
      `    ${e.email}${e.companyIndex === null ? '  (unassigned)' : ''}`,
    ),
  );
  console.log('────────────────────────────────────────────────────────\n');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

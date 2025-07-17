// Mock Prisma Client to avoid initialization issues
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    invoice: {
      upsert: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn()
    },
    timeEntry: {
      upsert: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn()
    },
    report: {
      upsert: jest.fn(),
      findMany: jest.fn()
    }
  }))
}));

// Mock the prisma instance
jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    invoice: {
      upsert: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn()
    },
    timeEntry: {
      upsert: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn()
    },
    report: {
      upsert: jest.fn(),
      findMany: jest.fn()
    }
  }
})); 
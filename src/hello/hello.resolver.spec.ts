import { Test, TestingModule } from '@nestjs/testing';
import { HelloResolver } from './hello.resolver';

describe('HelloResolver', () => {
  let resolver: HelloResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelloResolver],
    }).compile();

    resolver = module.get<HelloResolver>(HelloResolver);
  });

  it('is defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getHello', () => {
    it('returns Hello object with message', () => {
      const result = resolver.getHello();
      expect(result).toEqual({
        message: 'Hello World!',
      });
    });

    it('returns message property as string', () => {
      const result = resolver.getHello();
      expect(result.message).toBe('Hello World!');
    });
  });
});

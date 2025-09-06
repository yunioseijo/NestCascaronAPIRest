import { Body, Controller, Post, Headers } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @ApiOperation({ summary: 'Run initial seed to create admin user' })
  run(@Headers('x-seed-secret') seedSecret?: string) {
    return this.seedService.run(seedSecret);
  }
}


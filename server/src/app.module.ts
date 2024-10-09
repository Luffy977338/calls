import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoGateway } from './signaling/signaling.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, VideoGateway],
})
export class AppModule {}

import { Module } from '@nestjs/common';

import * as appInsights from 'applicationinsights';

import { ApplicationLoggerService } from './services/application-logger.service';

@Module({
    providers: [
        {
            provide: 'ApplicationInsight',
            useFactory: () => {
                appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
                appInsights.start();
                return appInsights.defaultClient;
            }
        },
        ApplicationLoggerService
    ],
    exports: [ApplicationLoggerService]
})
export class CommonModule {}

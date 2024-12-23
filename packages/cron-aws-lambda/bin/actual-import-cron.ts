#!/opt/homebrew/opt/node/bin/node
import * as cdk from 'aws-cdk-lib';
import { ActualImportCronStack } from '../lib/actual-import-cron-stack';

const app = new cdk.App();
new ActualImportCronStack(app, 'ActualImportCronStack', {});

import * as dotenv from "dotenv";
import * as cdk from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

dotenv.config({ path: __dirname + "/../../../.env" });

export class ActualImportCronStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    if (!process.env.PLUGGY_CLIENT_ID) {
      throw new Error("missing environment variable PLUGGY_CLIENT_ID");
    }

    const fn = new NodejsFunction(this, "ActualImportLambda", {
      entry: "lambda/index.ts",
      handler: "handler",
      bundling: {
        nodeModules: ["@actual-app/api"],
        forceDockerBundling: true,
        platform: "linux/arm64"
      },
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(60),
      environment: {
        PLUGGY_CLIENT_ID: process.env.PLUGGY_CLIENT_ID!,
        PLUGGY_CLIENT_SECRET: process.env.PLUGGY_CLIENT_SECRET!,
        PLUGGY_ITEM_IDS: process.env.PLUGGY_ITEM_IDS!,
        ACTUAL_BUDGET_URL: process.env.ACTUAL_BUDGET_URL!,
        ACTUAL_BUDGET_PASSWORD: process.env.ACTUAL_BUDGET_PASSWORD!,
        ACTUAL_BUDGET_SYNC_ID: process.env.ACTUAL_BUDGET_SYNC_ID!,
        ACTUAL_BUDGET_ENCRYPTION_KEY: process.env.ACTUAL_BUDGET_ENCRYPTION_KEY!,
      }
    });

    new Rule(this, "ActualImportRule", {
      schedule: Schedule.cron({ minute: "0", hour: "0" }),
      targets: [new LambdaFunction(fn)],
    });
  }
}

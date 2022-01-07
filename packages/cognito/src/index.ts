import { App, Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import {
  UserPool,
  StringAttribute,
  UserPoolClientIdentityProvider,
  AccountRecovery,
  CfnUserPool,
  ClientAttributes,
  UserPoolClient,
} from 'aws-cdk-lib/aws-cognito';

export class SleeplessCognito extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, 'userpool', {
      userPoolName: 'sleepless-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        isAdmin: new StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // casting like this with as should be avoided but there isn't a good way around this provided by cdk team
    const cfnUserPool = userPool.node.defaultChild as CfnUserPool;
    const fromEmailAddress = 'devkim.inc+contact@gmail.com'; // TODO: read this from process.env and secrets from aws secret manager or vaults
    cfnUserPool.emailConfiguration = {
        emailSendingAccount: 'DEVELOPER',
        replyToEmailAddress: 'devkim.inc+contact@gmail.com',
        sourceArn: `arn:aws:ses:cognito-ses-region:${
          Stack.of(this).account
        }:identity/devkim.inc+contact@gmail.com`,
    };
    cfnUserPool.emailConfiguration = {
      emailSendingAccount: 'DEVELOPER',
      from: `Developer from Sleepless <${fromEmailAddress}>`,
      sourceArn: `arn:aws:ses:us-east-1:${this.account}:identity/${fromEmailAddress}`,
    };

    const standardCognitoAttributes = {
      givenName: true,
      familyName: true,
      email: true,
      emailVerified: true,
      locale: true,
    };

    const clientReadAttributes = new ClientAttributes()
      .withStandardAttributes(standardCognitoAttributes)
      .withCustomAttributes(...['isAdmin']);

    const clientWriteAttributes = new ClientAttributes().withStandardAttributes(
      {
        ...standardCognitoAttributes,
        emailVerified: false,
      }
    );

    // // 👇 User Pool Client
    const userPoolClient = new UserPoolClient(this, 'userpool-client', {
      userPool,
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userSrp: true,
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
    });

    // 👇 Outputs
    new CfnOutput(this, 'userPoolId', {
      value: userPool.userPoolId,
    });
    new CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
  }
}

const app = new App();
new SleeplessCognito(app, 'SleeplessCognito');
app.synth();

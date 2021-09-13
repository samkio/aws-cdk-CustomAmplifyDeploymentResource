import * as path from "path";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { CustomResource, Duration, Stack } from "@aws-cdk/core";
import { Construct } from "@aws-cdk/core";
import { IBranch, IApp } from "@aws-cdk/aws-amplify";
import { Provider } from "@aws-cdk/custom-resources";

export interface AmplifyAssetDeploymentProps {
  /**
   * The Amplify app to deploy to.
   */
  readonly app: IApp;

  /**
   * The Amplify branch to deploy to.
   */
  readonly branch: IBranch;

  /**
   * The s3 bucket of the asset.
   */
  readonly s3BucketName: string;

  /**
   * The s3 object key of the asset.
   */
  readonly s3ObjectKey: string;
}

export class AmplifyAssetDeployment extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: AmplifyAssetDeploymentProps
  ) {
    super(scope, id);

    new CustomResource(this, "Resource", {
      serviceToken: AmplifyAssetDeploymentProvider.getOrCreate(this),
      resourceType: "Custom::AmplifyAssetDeployment",
      properties: {
        AppId: props.app.appId,
        BranchName: props.branch.branchName,
        S3ObjectKey: props.s3ObjectKey,
        S3BucketName: props.s3BucketName,
      },
    });
  }
}

class AmplifyAssetDeploymentProvider extends Construct {
  /**
   * Returns the singleton provider.
   */
  public static getOrCreate(scope: Construct) {
    const providerId =
      "com.samkio.cdk.custom-resources.amplify-asset-deployment-provider";
    const stack = Stack.of(scope);
    const group =
      (stack.node.tryFindChild(providerId) as AmplifyAssetDeploymentProvider) ||
      new AmplifyAssetDeploymentProvider(stack, providerId);
    return group.provider.serviceToken;
  }

  private readonly provider: Provider;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const onEvent = new NodejsFunction(
      this,
      "amplify-asset-deployment-on-event",
      {
        entry: path.join(
          __dirname,
          "amplify-asset-deployment-handler/index.ts"
        ),
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "onEvent",
        initialPolicy: [
          new iam.PolicyStatement({
            resources: ["*"],
            actions: [
              "s3:GetObject",
              "s3:GetSignedUrl",
              "amplify:ListJobs",
              "amplify:StartDeployment",
            ],
          }),
        ],
      }
    );

    const isComplete = new NodejsFunction(
      this,
      "amplify-asset-deployment-is-complete",
      {
        entry: path.join(
          __dirname,
          "amplify-asset-deployment-handler/index.ts"
        ),
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "isComplete",
        initialPolicy: [
          new iam.PolicyStatement({
            resources: ["*"],
            actions: ["amplify:GetJob*"],
          }),
        ],
      }
    );

    this.provider = new Provider(
      this,
      "amplify-asset-deployment-handler-provider",
      {
        onEventHandler: onEvent,
        isCompleteHandler: isComplete,
        totalTimeout: Duration.minutes(5),
      }
    );
  }
}

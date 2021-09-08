import * as cdk from "@aws-cdk/core";
import * as amplify from "@aws-cdk/aws-amplify";
import * as assets from "@aws-cdk/aws-s3-assets";
import { Provider } from "@aws-cdk/custom-resources";
import * as path from "path";
import { CustomResource } from "@aws-cdk/core";
import lambda = require("@aws-cdk/aws-lambda");
import * as iam from "@aws-cdk/aws-iam";
export class AmplifyCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const asset = new assets.Asset(this, "SampleAsset", {
      path: path.join(__dirname, "../my-app/build"),
    });

    const branchName = "main";
    const amplifyApp = new amplify.App(this, "MyApp", {});
    amplifyApp.addBranch("mainBranch", {
      branchName: branchName,
    });

    const onEvent = new lambda.Function(this, "amplifyDeploy-on-event", {
      code: lambda.Code.fromAsset(path.join(__dirname, "handler")),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: "index.on_event",
    });
    asset.grantRead(onEvent);
    // TODO find out minimum required permissions
    // TODO what about cross-account, cross-region calls?
    onEvent.addToRolePolicy(
      new iam.PolicyStatement({ resources: ["*"], actions: ["*"] })
    );

    const myProvider = new Provider(this, "MyProvider", {
      onEventHandler: onEvent,
    });

    new CustomResource(this, "AmplifyDeploymentResource", {
      serviceToken: myProvider.serviceToken,
      resourceType: "Custom::AmplifyDeployment",
      properties: {
        appId: amplifyApp.appId,
        branchName: branchName,
        bucketName: asset.s3BucketName,
        key: asset.s3ObjectKey,
      },
    });

    new cdk.CfnOutput(this, "S3BucketName", { value: asset.s3BucketName });
    new cdk.CfnOutput(this, "S3ObjectKey", { value: asset.s3ObjectKey });
    new cdk.CfnOutput(this, "S3HttpURL", { value: asset.httpUrl });
    new cdk.CfnOutput(this, "S3ObjectURL", { value: asset.s3ObjectUrl });
  }
}

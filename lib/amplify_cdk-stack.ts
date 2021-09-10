import * as cdk from "@aws-cdk/core";
import * as amplify from "@aws-cdk/aws-amplify";
import * as assets from "@aws-cdk/aws-s3-assets";
import * as path from "path";
import { AmplifyAssetDeployment } from "./amplify-asset-deployment";

export class AmplifyCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const asset = new assets.Asset(this, "SampleAsset", {
      path: path.join(__dirname, "../my-app/build"),
    });

    const branchName = "main";
    const amplifyApp = new amplify.App(this, "MyApp", {});
    const branch = amplifyApp.addBranch("mainBranch", {
      branchName: branchName,
    });

    new AmplifyAssetDeployment(this, "AmplifyAssetDeployment", {
      app: amplifyApp,
      branch: branch,
      s3BucketName: asset.s3BucketName,
      s3ObjectKey: asset.s3ObjectKey,
    });

    new cdk.CfnOutput(this, "S3BucketName", { value: asset.s3BucketName });
    new cdk.CfnOutput(this, "S3ObjectKey", { value: asset.s3ObjectKey });
    new cdk.CfnOutput(this, "S3HttpURL", { value: asset.httpUrl });
    new cdk.CfnOutput(this, "S3ObjectURL", { value: asset.s3ObjectUrl });
  }
}

import { expect as expectCDK, haveResource } from "@aws-cdk/assert";
import { Stack } from "@aws-cdk/core";
import { AmplifyAssetDeployment } from "../lib/amplify-asset-deployment";
import { mock } from "jest-mock-extended";
import { IApp, IBranch } from "@aws-cdk/aws-amplify";

test("Creates custom resource", () => {
  // GIVEN
  const stack = new Stack();
  const mockApp = mock<IApp>({ appId: "appIdValue" });
  const mockBranch = mock<IBranch>({ branchName: "branchNameValue" });

  // WHEN
  new AmplifyAssetDeployment(stack, "Test", {
    app: mockApp,
    branch: mockBranch,
    s3ObjectKey: "s3ObjectKeyValue",
    s3BucketName: "s3BucketNameValue",
  });

  // THEN
  expectCDK(stack).to(
    haveResource("Custom::AmplifyAssetDeployment", {
      ServiceToken: {
        "Fn::GetAtt": [
          "comsamkiocdkcustomresourcesamplifyassetdeploymentprovideramplifyassetdeploymenthandlerproviderframeworkonEventB958A8F3",
          "Arn",
        ],
      },
      AppId: "appIdValue",
      BranchName: "branchNameValue",
      S3ObjectKey: "s3ObjectKeyValue",
      S3BucketName: "s3BucketNameValue",
    })
  );

  expectCDK(stack).to(
    haveResource("AWS::IAM::Role", {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
          },
        ],
        Version: "2012-10-17",
      },
    })
  );
  expectCDK(stack).to(
    haveResource("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              "s3:GetObject",
              "s3:GetSignedUrl",
              "amplify:ListJobs",
              "amplify:StartDeployment",
            ],
            Effect: "Allow",
            Resource: "*",
          },
        ],
        Version: "2012-10-17",
      },
    })
  );

  expectCDK(stack).to(
    haveResource("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: [
          {
            Action: "amplify:GetJob*",
            Effect: "Allow",
            Resource: "*",
          },
        ],
        Version: "2012-10-17",
      },
    })
  );
});

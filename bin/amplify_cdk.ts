#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { AmplifyCdkStack } from "../lib/amplify_cdk-stack";

const app = new cdk.App();
new AmplifyCdkStack(app, "AmplifyCdkStack");

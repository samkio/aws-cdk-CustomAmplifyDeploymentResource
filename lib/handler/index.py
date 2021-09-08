import boto3
import requests

s3 = boto3.client('s3')
amplify = boto3.client('amplify')

def on_event(event, context):
  print(event)
  request_type = event['RequestType']
  if request_type == 'Create': return on_create(event)
  if request_type == 'Update': return on_update(event)
  if request_type == 'Delete': return on_delete(event)
  raise Exception("Invalid request type: %s" % request_type)

def on_create(event):
  props = event["ResourceProperties"]
  print("create new resource with props %s" % props)

  # 1. Retrieve Asset from S3
  s3.download_file(props['bucketName'], props['key'], '/tmp/artifacts.zip')

  # 2. Create Amplify Deployment
  response = amplify.create_deployment(
    appId=props['appId'],
    branchName=props['branchName']
  )
  jobId = response["jobId"];
  zipUploadUrl = response["zipUploadUrl"];

  # 3. Upload artifact to Amplify
  with open('/tmp/artifacts.zip', 'rb') as f:
    r = requests.put(zipUploadUrl, data=f, headers={"Content-Type": 'application/zip'});

  # 4. Start Amplify Deployment
  amplify.start_deployment(
    appId=props['appId'],
    branchName=props['branchName'],
    jobId = jobId,
  )

  # TODO failure cases
  # Useful doc https://dev.to/nicolasbeauvais/continuous-aws-amplify-deployment-22d0

def on_update(event):
  physical_id = event["PhysicalResourceId"]
  props = event["ResourceProperties"]
  print("update resource %s with props %s" % (physical_id, props))
  on_create(event)

def on_delete(event):
  physical_id = event["PhysicalResourceId"]
  print("delete resource %s" % physical_id)
  # ...


# def on_event(event, ctx):
#   print(event)
#   return {
#     'ArbitraryField': 12345
#   }
#
# def is_complete(event, ctx):
#   print(event)
#
#   # verify result from on_event is passed through
#   if event.get('ArbitraryField', None) != 12345:
#     raise 'Error: expecting "event" to include "ArbitraryField" with value 12345'
#
#   # nothing to assert if this resource is being deleted
#   if event['RequestType'] == 'Delete':
#     return { 'IsComplete': True }
#
#   props = event['ResourceProperties']
#   bucket_name = props['BucketName']
#   object_key = props['ObjectKey']
#   expected_content = props['ExpectedContent']
#
#   print("reading content from s3://%s/%s" % (bucket_name, object_key))
#   content = None
#   try:
#     result = s3.get_object(Bucket=bucket_name, Key=object_key)
#     content = result['Body'].read().decode('utf-8')
#   except s3.exceptions.NoSuchKey:
#     print("file not found")
#     pass
#
#   print("actual content: %s" % content)
#   print("expected content: %s" % expected_content)
#
#   is_equal = content == expected_content
#
#   if is_equal:
#     print("s3 content matches expected")
#
#   return { 'IsComplete': is_equal }

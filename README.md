# "VerticalTwitter" Tweet Monitoring System

## Overview

This project is a Twitter tweet monitoring system that allows users to browse and query tweets\* in real-time. This was not tested with real Twitter API, but it should probably work.Instead of real one, it uses mocked one just to be able to run and test system in AWS.

\*_not really_

### Basic "How it works"

1. **vertical-api** (AWS Fargate) Listens to Twitter real time Tweet Stream.
2. **vertical-api** (AWS Fargate) sends all received tweets to **tweets-sqs** (AWS SQS)
3. **tweets-sqs** (AWS SQS) triggers **tweet-processor** (AWS Lambda)
4. **tweet-processor** (AWS Lambda) tries saving item to dynamoDB. If it's duplicate (tweetId already exists), then it ends here.
5. **tweet-processor** (AWS Lambda) calls external GEO API to get country name of tweet (if tweet has coordinates. If not it will say "unknown").
6. **tweet-processor** (AWS Lambda) creates log message in CloudWatch with country name in it.
7. Cloudwatch Metric Filter picks up this log and you can see where Tweets are trending.

## Things to improve / known issues

- Test coverage and quality.
- vertical-api tweet stream monitor autmatically reconnects when connection to twitter API stream errors or closes. Problem is that messages between these connections are lost. Twitter API allows specifying "backfill_minutes" query param, to fill the gap, but this was not implemented here.
- Use some actual geo API to retrieve country name by coordinates
- Accessing saved tweets in dynamoDB is wrong. It uses `scan` operation to get items from DynamoDB, which can be costly. And there is no pagination or anything. The code simply scans whole table and returns result.
- Add Swagger to make it more clear how endpoints look / should be used.
- Ideally - test this with real Twitter API.

## Project Structure

The project is organized as an NX Nrwl mono repo with three Node.js applications (found under "apps" directory):

1. **vertical-api (AWS Fargate):** Manages the real-time tweet stream, historical data retrieval, and monitoring of the current tweet stream. Exposes API for users / admins to access. Sends received tweets through AWS SQS for **tweet-processor** to process.

2. **tweet-processor (AWS Lambda):** Responsible for processing tweets, saving them in DynamoDB, and logging the tweet's origin country (for CloudWatch metrics).

3. **twitter-mock (AWS Fargate):** **_!!! POOR CODE QUALITY ALERT !!!_** Since Twitter API is paid, this app acts as a mock server for Twitter API. Little amount of time was spent writing code here. It just covers expected behaviour of Twitter API. Also, it acts as a fake "GEO API" used to retrieve country data from given coordinates.

## Prerequisites

Before deploying the system, ensure you have the following:

- AWS account with the necessary permissions.
- Twitter API token stored as "twitter_api_token" in AWS Secrets Manager.
- GEO API token stored as "geo_api_token" in AWS Secrets Manager.
- Vertical API token stored as "vertical_api_token" in AWS Secrets Manager (used for authenticating with "vertical-api" app).

_Note: since this system doesn't really connect to any real API, all of these secrets can be random strings_

## Building and Deploying

1. Build all applications:

   ```
   npm run build
   ```

2. Build Docker images:

   ```
   npm run docker-build
   ```

3. Deploy Terraform code (from `.ci/terraform` directory):

   ```
   terraform init
   terraform apply
   ```

### Don't forget to push docker images

Both "vertical-api" and "twitter-mock" run on AWS Fargate. After the initial deployment of the infrastructure, you need to push each app's docker images to correct AWS ECR repository, both of them are created by Terraform. To do that:

1. Go to AWS console, then ECR. Check URI of "twitter-mock" and "vertical-api".

2. If not done yet - build Docker images for all apps:

   ```
   npm run docker-build
   ```

3. Tag both images with ECR URI:

   ```
   docker tag <images-name> <ecr-repository-uri>
   ```

4. Push the Docker image to the "vertical-api"/"twitter-mock" ECR repository ():

   ```
   docker push <ecr-repository-uri>
   ```

5. The Fargate service will automatically pick up the new Docker image, ensuring the latest version is running.

## Usage

### vertical-api Public Endpoints:

- **GET /api/monitor-stream:** Connect to the stream of tweets being processed.

- **GET /api/processed-tweets:** Retrieve all saved records from DynamoDB.

### vertical-api Private Endpoints:

These endpoints require a Bearer token in the request headers stored in "vertical_api_token" AWS secret.

- **PUT /api/admin/set-keywords:** Set stream rules for the Twitter stream. Requires body: { keywords: string }.

- **POST /api/admin/enable-monitoring:** Start monitoring the tweet stream.

- **POST /api/admin/disable-monitoring:** Stop monitoring the tweet stream.

- **GET /api/admin/stream-status:** Get the status of monitoring.

### CloudWatch Metrics

The origin country of every tweet (if tweet does not have geo coordinates, then it will be visible as `"unknown"`) is published to CloudWatch metrics.

# lambda.tf
resource "aws_lambda_function" "tweet_processor" {
  function_name = "tweet-processor"
  role          = aws_iam_role.tweet_processor_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30

  filename         = data.archive_file.tweet_processor_zip.output_path
  source_code_hash = data.archive_file.tweet_processor_zip.output_base64sha256

  vpc_config {
    subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_group_ids = [aws_security_group.egress_all.id]
  }

  environment {
    variables = {
      PROCESSED_TWEETS_TABLE    = "${aws_dynamodb_table.processed_tweets.name}"
      GEO_API_URL               = "http://${aws_alb.vertical_twitter.dns_name}/mock"
      GEO_API_TOKEN_SECRET_NAME = "geo_api_token"
    }
  }
}

data "archive_file" "tweet_processor_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../dist/apps/tweet-processor/"
  output_path = "${path.module}/../../dist/sample-lambda.zip"
}

resource "aws_lambda_event_source_mapping" "tweet_processor_sqs_trigger" {
  event_source_arn = aws_sqs_queue.tweets_sqs.arn
  enabled          = true
  function_name    = aws_lambda_function.tweet_processor.arn
  batch_size       = 1
}

# policies.tf

# ECS task execution role
resource "aws_iam_role" "ecs_task_execution_role" {
  name               = "ecs-task-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json
}

data "aws_iam_policy_document" "ecs_task_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy" "ecs_task_execution_role" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = data.aws_iam_policy.ecs_task_execution_role.arn
}

# lambda assume role policy
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# vertical-api task role / policies
resource "aws_iam_role" "vertical_api_task_role" {
  name               = "vertical-api-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json
}

data "aws_iam_policy_document" "vertical_api_policy_pack" {
  statement {
    sid    = "SQS"
    effect = "Allow"
    actions = [
      "sqs:SendMessage"
    ]
    resources = [
      aws_sqs_queue.tweets_sqs.arn
    ]
  }

  statement {
    sid    = "getSecret"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue"
    ]

    resources = [
      "arn:aws:secretsmanager:${local.region_name}:${local.aws_account_id}:secret:vertical_api_token-*",
      "arn:aws:secretsmanager:${local.region_name}:${local.aws_account_id}:secret:twitter_api_token-*"
    ]
  }

  statement {
    sid    = "dynamo"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]

    resources = [
      aws_dynamodb_table.processed_tweets.arn
    ]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "${aws_cloudwatch_log_group.vertical_api.arn}*"
    ]
  }
}

resource "aws_iam_policy" "vertical_api_policy" {
  name   = "vertical-api-policy"
  policy = data.aws_iam_policy_document.vertical_api_policy_pack.json
}

resource "aws_iam_role_policy_attachment" "vertical_api_policy_pack" {
  role       = aws_iam_role.vertical_api_task_role.name
  policy_arn = aws_iam_policy.vertical_api_policy.arn
}

# tweet-processor
resource "aws_iam_role" "tweet_processor_role" {
  name               = "tweet_processor_role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "tweet_processor_policy_pack" {
  statement {
    sid    = "SQS"
    effect = "Allow"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueUrl",
      "sqs:GetQueueAttributes"
    ]
    resources = [
      aws_sqs_queue.tweets_sqs.arn
    ]
  }

  statement {
    sid    = "dynamo"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem"
    ]

    resources = [
      aws_dynamodb_table.processed_tweets.arn
    ]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "${aws_cloudwatch_log_group.tweet_processor.arn}*"
    ]
  }
}

resource "aws_iam_policy" "tweet_processor_policy" {
  name   = "tweet-processor-policy"
  policy = data.aws_iam_policy_document.tweet_processor_policy_pack.json
}

resource "aws_iam_role_policy_attachment" "tweet_processor_policy_pack" {
  role       = aws_iam_role.tweet_processor_role.name
  policy_arn = aws_iam_policy.tweet_processor_policy.arn
}

resource "aws_iam_role_policy_attachment" "tweet_processor_aws__lambda_vpc_access" {
  role       = aws_iam_role.tweet_processor_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

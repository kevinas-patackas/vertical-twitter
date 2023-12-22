# This file only contains twitter mock related terraform code.
# If twitter allowed any free read access - this would not exist.

resource "aws_ecs_cluster" "twitter_mock" {
  name = "twitter-mock"
}

resource "aws_ecr_repository" "twitter_mock" {
  name = "twitter-mock"
}

resource "aws_ecs_service" "twitter_mock" {
  name            = "twitter-mock"
  task_definition = aws_ecs_task_definition.twitter_mock.arn
  cluster         = aws_ecs_cluster.twitter_mock.id
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    assign_public_ip = false

    security_groups = [
      aws_security_group.egress_all.id,
      aws_security_group.ingress_api.id,
    ]

    subnets = [
      aws_subnet.private_a.id,
      aws_subnet.private_b.id,
    ]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.twitter_mock.arn
    container_name   = "twitter-mock"
    container_port   = "3000"
  }

  depends_on = [aws_lb_listener_rule.twitter_mock_rule]
}

resource "aws_ecs_task_definition" "twitter_mock" {
  family = "twitter-mock"

  container_definitions = <<EOF
  [
    {
      "name": "twitter-mock",
      "image": "${aws_ecr_repository.twitter_mock.repository_url}:latest",
      "portMappings": [
        {
          "containerPort": 3000
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-region": "eu-west-1",
          "awslogs-group": "/ecs/twitter-mock",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {
          "name": "SQS_QUEUE_URL",
          "value": "${aws_sqs_queue.tweets_sqs.url}"
        },
        {
          "name": "TWITTER_API_URL",
          "value": "https://api.twitter.com"
        },
        {
          "name": "TWITTER_TOKEN_SECRET_NAME",
          "value": "twitter_api_token"
        }
      ]
    }
  ]
  EOF

  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn      = aws_iam_role.twitter_mock_task_role.arn

  # These are the minimum values for Fargate containers CPU: 256 memory: 512
  cpu                      = 256
  memory                   = 512
  requires_compatibilities = ["FARGATE"]

  network_mode = "awsvpc"
}

resource "aws_lb_target_group" "twitter_mock" {
  name        = "twitter-mock"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.app_vpc.id

  health_check {
    enabled = true
    path    = "/mock/health"
  }

  depends_on = [aws_alb.vertical_twitter]
}

# ALB
resource "aws_lb_listener_rule" "twitter_mock_rule" {
  listener_arn = aws_alb_listener.vertical_api_http.arn

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.twitter_mock.arn
  }

  condition {
    path_pattern {
      values = ["/mock/*"]
    }
  }
}

# CLOUDWATCH
resource "aws_cloudwatch_log_group" "twitter_mock" {
  name = "/ecs/twitter-mock"
}

# POLICIES / ROLES
resource "aws_iam_role" "twitter_mock_task_role" {
  name               = "twitter-mock-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json
}

data "aws_iam_policy_document" "twitter_mock_policy_pack" {
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "${aws_cloudwatch_log_group.twitter_mock.arn}*"
    ]
  }
}

resource "aws_iam_policy" "twitter_mock_policy" {
  name   = "twitter-mock-policy"
  policy = data.aws_iam_policy_document.twitter_mock_policy_pack.json
}

resource "aws_iam_role_policy_attachment" "twitter_mock_policy_pack" {
  role       = aws_iam_role.twitter_mock_task_role.name
  policy_arn = aws_iam_policy.twitter_mock_policy.arn
}

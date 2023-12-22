resource "aws_ecs_cluster" "vertical_api" {
  name = "vertical-api"
}

resource "aws_ecr_repository" "vertical_api" {
  name = "vertical-api"
}

resource "aws_ecs_service" "vertical_api" {
  name            = "vertical-api"
  task_definition = aws_ecs_task_definition.vertical_api.arn
  cluster         = aws_ecs_cluster.vertical_api.id
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
    target_group_arn = aws_lb_target_group.vertical_api.arn
    container_name   = "vertical-api"
    container_port   = "3000"
  }

  depends_on = [aws_lb_listener_rule.vertical_api_rule]
}

resource "aws_ecs_task_definition" "vertical_api" {
  family = "vertical-api"

  container_definitions = <<EOF
  [
    {
      "name": "vertical-api",
      "image": "${aws_ecr_repository.vertical_api.repository_url}:latest",
      "portMappings": [
        {
          "containerPort": 3000
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-region": "eu-west-1",
          "awslogs-group": "/ecs/vertical-api",
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
          "value": "http://${aws_alb.vertical_twitter.dns_name}/mock"
        },
        {
          "name": "PROCESSED_TWEETS_TABLE",
          "value": "${aws_dynamodb_table.processed_tweets.name}"
        },
        {
          "name": "TWITTER_TOKEN_SECRET_NAME",
          "value": "twitter_api_token"
        },
        {
          "name": "VERTICAL_API_TOKEN_SECRET_NAME",
          "value": "vertical_api_token"
        }
      ]
    }
  ]
  EOF

  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn      = aws_iam_role.vertical_api_task_role.arn

  # These are the minimum values for Fargate containers CPU: 256 memory: 512
  cpu                      = 256
  memory                   = 512
  requires_compatibilities = ["FARGATE"]

  network_mode = "awsvpc"
}

resource "aws_lb_target_group" "vertical_api" {
  name        = "vertical-api"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.app_vpc.id

  health_check {
    enabled = true
    path    = "/api/health"
  }

  depends_on = [aws_alb.vertical_twitter]
}

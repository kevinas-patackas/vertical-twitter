# sqs.tf
resource "aws_sqs_queue" "tweets_sqs" {
  name                       = "tweets-sqs"
  visibility_timeout_seconds = 30
}

resource "aws_sqs_queue" "tweets_dlq" {
  name                       = "tweets-dlq"
}

resource "aws_sqs_queue_redrive_policy" "tweets_sqs_redrive_to_dlq" {
  queue_url = aws_sqs_queue.tweets_sqs.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.tweets_dlq.arn
    maxReceiveCount     = 3
  })
}

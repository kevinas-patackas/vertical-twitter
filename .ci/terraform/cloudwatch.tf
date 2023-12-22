resource "aws_cloudwatch_log_group" "vertical_api" {
  name = "/ecs/vertical-api"
}

resource "aws_cloudwatch_log_group" "tweet_processor" {
  name = "/aws/lambda/tweet-processor"
}

resource "aws_cloudwatch_log_metric_filter" "tweet_country_metric" {
  name           = "TweetCountryMetricFilter"
  pattern        = "{$.message = \"Capturing tweet origin country for metrics\" }"
  log_group_name = aws_cloudwatch_log_group.tweet_processor.name

  metric_transformation {
    name      = "TweetCountryMetric"
    namespace = "TweetProcessor"
    value     = "1"
    dimensions = {
      country = "$.context.country"
    }
  }
}

resource "aws_dynamodb_table" "processed_tweets" {
  name           = "processed-tweets"
  hash_key       = "tweetId"
  range_key      = "creation_date"
  billing_mode   = "PAY_PER_REQUEST"
  stream_enabled = false

  attribute {
    name = "tweetId"
    type = "S"
  }

  attribute {
    name = "creation_date"
    type = "S"
  }
}

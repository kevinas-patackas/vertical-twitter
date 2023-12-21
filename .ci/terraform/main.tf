# main.tf
provider "aws" {
  region = "eu-west-1"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  region_name    = data.aws_region.current.name
  aws_account_id = data.aws_caller_identity.current.account_id
}

terraform {
  required_version = ">= 1.0"

  backend "s3" {
    bucket         = "vertical-twitter-terraform-state"
    key            = "vertical-twitter/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "vertical-twitter-terraform-state-lock"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.30.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "2.2.0"
    }
  }
}

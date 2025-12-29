terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.region
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Base name for resources"
  type        = string
  default     = "mindmap-explorer"
}

variable "stage" {
  description = "Deployment stage"
  type        = string
  default     = "dev"
}

locals {
  lambda_env = {
    DYNAMODB_TABLE      = aws_dynamodb_table.explorations.name
    AUTH_TOKEN_OWNER    = var.auth_token_owner
    AUTH_TOKEN_FRIENDS  = var.auth_token_friends
    BEDROCK_REGION      = var.bedrock_region != "" ? var.bedrock_region : null
    BEDROCK_MODEL_ID    = var.bedrock_model_id != "" ? var.bedrock_model_id : null
    AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
  }
}

variable "auth_token_owner" {
  description = "Bearer token for owner account"
  type        = string
  default     = "owner-demo-token"
}

variable "auth_token_friends" {
  description = "Bearer token for friends account"
  type        = string
  default     = "friends-demo-token"
}

variable "bedrock_region" {
  description = "Region for Bedrock model (optional)"
  type        = string
  default     = ""
}

variable "bedrock_model_id" {
  description = "Bedrock model id (optional)"
  type        = string
  default     = ""
}

resource "aws_dynamodb_table" "explorations" {
  name         = "${var.project_name}-${var.stage}-explorations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "explorationId"

  attribute {
    name = "explorationId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "updatedAt"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-updatedAt-index"
    hash_key        = "userId"
    range_key       = "updatedAt"
    projection_type = "ALL"
  }

  tags = {
    Project = var.project_name
    Stage   = var.stage
  }
}

resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-${var.stage}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "${var.project_name}-${var.stage}-dynamodb"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:DeleteItem", "dynamodb:UpdateItem", "dynamodb:Query"],
        Resource = [aws_dynamodb_table.explorations.arn, "${aws_dynamodb_table.explorations.arn}/index/*"]
      }
    ]
  })
}

locals {
  handlers = {
    "explore-start"      = { file = "explore-start.js",      path = "../backend/dist/explore-start.js" }
    "explore-expand"     = { file = "explore-expand.js",     path = "../backend/dist/explore-expand.js" }
    "explore-explain"    = { file = "explore-explain.js",    path = "../backend/dist/explore-explain.js" }
    "explorations-list"  = { file = "explorations-list.js",  path = "../backend/dist/explorations-list.js" }
    "exploration-state"  = { file = "exploration-state.js",  path = "../backend/dist/exploration-state.js" }
    "exploration-delete" = { file = "exploration-delete.js", path = "../backend/dist/exploration-delete.js" }
  }
}

data "archive_file" "lambda_zips" {
  for_each    = local.handlers
  type        = "zip"
  source_file = each.value.path
  output_path = "build/${each.key}.zip"
}

resource "aws_lambda_function" "api" {
  for_each         = local.handlers
  function_name    = "${var.project_name}-${var.stage}-${each.key}"
  role             = aws_iam_role.lambda.arn
  handler          = "${each.key}.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.lambda_zips[each.key].output_path
  source_code_hash = data.archive_file.lambda_zips[each.key].output_base64sha256
  architectures    = ["arm64"]
  environment {
    variables = local.lambda_env
  }
}

resource "aws_apigatewayv2_api" "http" {
  name          = "${var.project_name}-${var.stage}"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "lambda" {
  for_each                 = aws_lambda_function.api
  api_id                   = aws_apigatewayv2_api.http.id
  integration_type         = "AWS_PROXY"
  integration_uri          = each.value.invoke_arn
  payload_format_version   = "2.0"
  integration_method       = "POST"
  timeout_milliseconds     = 29000
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = {
    "POST /explore/start"                  = "explore-start"
    "POST /explore/{explorationId}/expand" = "explore-expand"
    "POST /explore/{explorationId}/explain" = "explore-explain"
    "GET /explore/{explorationId}/state/{stateIndex}" = "exploration-state"
    "GET /explorations"                    = "explorations-list"
    "DELETE /explorations/{explorationId}" = "exploration-delete"
  }

  api_id    = aws_apigatewayv2_api.http.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.lambda[each.value].id}"
}

resource "aws_lambda_permission" "api" {
  for_each = aws_lambda_function.api

  statement_id  = "AllowExecutionFromAPIGateway-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

output "api_endpoint" {
  value       = aws_apigatewayv2_stage.default.invoke_url
  description = "Base URL for the HTTP API"
}

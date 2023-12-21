# alb.tf
resource "aws_alb" "vertical_twitter" {
  name               = "vertical-api-lb"
  internal           = false
  load_balancer_type = "application"

  subnets = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id,
  ]

  security_groups = [
    aws_security_group.http.id,
    aws_security_group.https.id,
    aws_security_group.egress_all.id,
  ]

  depends_on = [aws_internet_gateway.igw]
}

resource "aws_alb_listener" "vertical_api_http" {
  load_balancer_arn = aws_alb.vertical_twitter.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      status_code  = "404"
      message_body = "Not Found"
    }
  }

  #  default_action {
  #     type = "redirect"

  #     redirect {
  #      port        = "443"
  #       protocol    = "HTTPS"
  #       status_code = "HTTP_301"
  #     }
  #   }
}

resource "aws_lb_listener_rule" "vertical_api_rule" {
  listener_arn = aws_alb_listener.vertical_api_http.arn

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.vertical_api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# These comments are here so Terraform doesn't try to create the listener
# before we have a valid certificate.
# resource "aws_alb_listener" "vertical_api_https" {
#   load_balancer_arn = aws_alb.vertical_twitter.arn
#   port              = "443"
#   protocol          = "HTTPS"
#   certificate_arn   = aws_acm_certificate.vertical_api.arn

#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.vertical_api.arn
#   }
# }

# resource "aws_acm_certificate" "vertical_api" {
#   domain_name       = "vertical-api.kevinaspatackas.com"
#   validation_method = "DNS"
# }

# output "domain_validations" {
#   value = aws_acm_certificate.vertical_api.domain_validation_options
# }

output "alb_url" {
  value = "http://${aws_alb.vertical_twitter.dns_name}"
}

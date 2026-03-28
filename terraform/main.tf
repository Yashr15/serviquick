# ──────────────────────────────────────────────────────────────────────────────
#  ServiQuick – AWS infrastructure
#
#  Resources provisioned
#  ├── VPC (public + private subnets across 2 AZs, NAT Gateway)
#  ├── ECR repositories (backend, frontend)
#  ├── ECS Cluster (Fargate)
#  ├── ECS Task Definitions & Services (backend, frontend)
#  ├── Application Load Balancer (internet-facing, HTTP + optional HTTPS)
#  ├── Security Groups (ALB, backend, frontend)
#  ├── IAM Roles (ECS task execution)
#  ├── SSM Parameter Store (MongoDB URI & JWT secret)
#  ├── CloudWatch Log Groups + Alarms
#  └── Application Auto Scaling (backend & frontend ECS services)
# ──────────────────────────────────────────────────────────────────────────────

provider "aws" {
  region = var.aws_region
}

locals {
  name = "${var.project}-${var.env}"
  azs  = ["${var.aws_region}a", "${var.aws_region}b"]
  tags = {
    Project     = var.project
    Environment = var.env
    ManagedBy   = "terraform"
  }
}

# ── Data ──────────────────────────────────────────────────────────────────────
data "aws_caller_identity" "current" {}

# ── VPC ───────────────────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.tags, { Name = "${local.name}-vpc" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, { Name = "${local.name}-igw" })
}

# ── Subnets ───────────────────────────────────────────────────────────────────
resource "aws_subnet" "public" {
  count                   = length(local.azs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  tags = merge(local.tags, { Name = "${local.name}-public-${count.index + 1}" })
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]
  tags = merge(local.tags, { Name = "${local.name}-private-${count.index + 1}" })
}

# ── NAT Gateway (one per VPC for cost efficiency) ────────────────────────────
resource "aws_eip" "nat" {
  domain     = "vpc"
  tags       = merge(local.tags, { Name = "${local.name}-nat-eip" })
  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = merge(local.tags, { Name = "${local.name}-nat" })
  depends_on    = [aws_internet_gateway.main]
}

# ── Route tables ──────────────────────────────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = merge(local.tags, { Name = "${local.name}-public-rt" })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
  tags = merge(local.tags, { Name = "${local.name}-private-rt" })
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ── ECR Repositories ──────────────────────────────────────────────────────────
resource "aws_ecr_repository" "backend" {
  name                 = "${local.name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${local.name}-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags
}

# ── SSM Parameters (secrets) ─────────────────────────────────────────────────
resource "aws_ssm_parameter" "mongodb_uri" {
  name  = "/${local.name}/MONGODB_URI"
  type  = "SecureString"
  value = var.mongodb_uri
  tags  = local.tags
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${local.name}/JWT_SECRET"
  type  = "SecureString"
  value = var.jwt_secret
  tags  = local.tags
}

resource "aws_ssm_parameter" "cors_origin" {
  name  = "/${local.name}/CORS_ORIGIN"
  type  = "String"
  value = var.cors_origin
  tags  = local.tags
}

# ── IAM – ECS Task Execution Role ─────────────────────────────────────────────
resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name}-ecs-task-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_basic" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow the execution role to read the SSM secrets.
resource "aws_iam_role_policy" "ecs_ssm_read" {
  name = "${local.name}-ecs-ssm-read"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["ssm:GetParameters", "ssm:GetParameter"]
      Resource = [
        aws_ssm_parameter.mongodb_uri.arn,
        aws_ssm_parameter.jwt_secret.arn,
        aws_ssm_parameter.cors_origin.arn,
      ]
    }]
  })
}

# ── IAM – ECS Task Role (for Auto Scaling permissions) ────────────────────────
resource "aws_iam_role" "ecs_task" {
  name = "${local.name}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.tags
}

# ── ECS Cluster ───────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${local.name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.tags
}

# ── CloudWatch Log Groups ─────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.name}/backend"
  retention_in_days = 30
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${local.name}/frontend"
  retention_in_days = 30
  tags              = local.tags
}

# ── CloudWatch Alarms ─────────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "backend_cpu_high" {
  alarm_name          = "${local.name}-backend-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Backend ECS CPU > 70% – consider scaling"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.backend.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_high" {
  alarm_name          = "${local.name}-alb-5xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 20
  alarm_description   = "ALB 5xx errors > 20/min"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.tags
}

# ── Security Groups ───────────────────────────────────────────────────────────

# ALB: allow HTTP/HTTPS from anywhere
resource "aws_security_group" "alb" {
  name        = "${local.name}-alb-sg"
  description = "Allow HTTP and HTTPS traffic to the ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${local.name}-alb-sg" })
}

# Frontend: only accept traffic from the ALB
resource "aws_security_group" "frontend" {
  name        = "${local.name}-frontend-sg"
  description = "Frontend service – traffic from ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${local.name}-frontend-sg" })
}

# Backend: only accept traffic from the frontend service and ALB
resource "aws_security_group" "backend" {
  name        = "${local.name}-backend-sg"
  description = "Backend API – traffic from frontend and ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend.id, aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${local.name}-backend-sg" })
}

# ── Application Load Balancer ─────────────────────────────────────────────────
resource "aws_lb" "main" {
  name               = "${local.name}-alb"
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  # Enable access logs for debugging (optional – requires an S3 bucket)
  # access_logs { bucket = "..." enabled = true }

  tags = local.tags
}

# ── Target groups ─────────────────────────────────────────────────────────────
resource "aws_lb_target_group" "frontend" {
  name        = "${local.name}-fe-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200"
  }

  tags = local.tags
}

resource "aws_lb_target_group" "backend" {
  name        = "${local.name}-be-tg"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200"
  }

  tags = local.tags
}

# ── ALB Listeners ─────────────────────────────────────────────────────────────

# HTTP → redirect to HTTPS when a certificate is provided, else forward
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = var.acm_certificate_arn != "" ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.acm_certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    dynamic "forward" {
      for_each = var.acm_certificate_arn != "" ? [] : [1]
      content {
        target_group {
          arn = aws_lb_target_group.frontend.arn
        }
      }
    }
  }
}

# HTTPS listener (only created when an ACM certificate ARN is provided)
resource "aws_lb_listener" "https" {
  count             = var.acm_certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

# /api/* → backend target group
resource "aws_lb_listener_rule" "api" {
  listener_arn = var.acm_certificate_arn != "" ? aws_lb_listener.https[0].arn : aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health"]
    }
  }
}

# ── ECS Task Definition – Backend ────────────────────────────────────────────
resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
    essential = true

    portMappings = [{
      containerPort = 4000
      protocol      = "tcp"
    }]

    secrets = [
      { name = "MONGODB_URI", valueFrom = aws_ssm_parameter.mongodb_uri.arn },
      { name = "JWT_SECRET", valueFrom = aws_ssm_parameter.jwt_secret.arn },
      { name = "CORS_ORIGIN", valueFrom = aws_ssm_parameter.cors_origin.arn },
    ]

    environment = [
      { name = "PORT", value = "4000" },
      { name = "NODE_ENV", value = var.env },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "backend"
      }
    }
  }])

  tags = local.tags
}

# ── ECS Task Definition – Frontend ───────────────────────────────────────────
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${local.name}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = "${aws_ecr_repository.frontend.repository_url}:${var.frontend_image_tag}"
    essential = true

    portMappings = [{
      containerPort = 80
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "frontend"
      }
    }
  }])

  tags = local.tags
}

# ── ECS Service – Backend ─────────────────────────────────────────────────────
resource "aws_ecs_service" "backend" {
  name            = "${local.name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  launch_type     = "FARGATE"
  desired_count   = var.backend_desired_count

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 4000
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  depends_on = [aws_lb_listener.http]

  tags = local.tags
}

# ── ECS Service – Frontend ────────────────────────────────────────────────────
resource "aws_ecs_service" "frontend" {
  name            = "${local.name}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  launch_type     = "FARGATE"
  desired_count   = var.frontend_desired_count

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.frontend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  depends_on = [aws_lb_listener.http]

  tags = local.tags
}

# ── Application Auto Scaling – Backend ───────────────────────────────────────
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = var.backend_max_count
  min_capacity       = var.backend_desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${local.name}-backend-cpu-scale"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 60.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# ── Application Auto Scaling – Frontend ──────────────────────────────────────
resource "aws_appautoscaling_target" "frontend" {
  max_capacity       = var.frontend_max_count
  min_capacity       = var.frontend_desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.frontend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "frontend_cpu" {
  name               = "${local.name}-frontend-cpu-scale"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 60.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

#!/bin/bash
# 测试创意喵所有服务

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check() {
  local url=$1
  local name=$2
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

  if [ "$status" = "200" ] || [ "$status" = "301" ] || [ "$status" = "302" ]; then
    echo -e "${GREEN}✓${NC} $name ($url) - HTTP $status"
    return 0
  else
    echo -e "${RED}✗${NC} $name ($url) - HTTP $status"
    return 1
  fi
}

echo "=== 创意喵服务测试 ==="
echo ""

failed=0

check "https://meow.host/" "落地页" || ((failed++))
check "https://meow.host/square/" "Square应用 (/square/)" || ((failed++))
check "https://meow.host/admin/" "后台管理 (/admin/)" || ((failed++))
check "https://meow.host/api/health" "API健康检查" || ((failed++))

echo ""
if [ $failed -eq 0 ]; then
  echo -e "${GREEN}所有服务正常${NC}"
  exit 0
else
  echo -e "${RED}$failed 个服务异常${NC}"
  exit 1
fi

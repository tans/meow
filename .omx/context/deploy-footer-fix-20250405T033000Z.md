# Context Snapshot: Deploy Fix & Footer Entry

## Task Statement
修复部署问题：/admin /api /web 不能正常访问，同时在官网 footer 增加入口链接

## Desired Outcome
1. https://miao.ali.minapp.xin/admin 正常访问
2. https://miao.ali.minapp.xin/web 正常访问  
3. https://miao.ali.minapp.xin/api 正常访问
4. 官网 footer 增加 admin 和 web 入口链接

## Current State (from previous agent summary)
- Landing Page: Working
- Web App: Fixed (paths changed from /assets/ to ./assets/)
- Admin App: Fixed (paths changed, but verification truncated)
- API Proxy: Entry server running on 26401

## Known Facts
- Server: 139.224.105.241
- Directory: /www/sites/meow.ali.minapp.xin/
- Nginx config: /opt/1panel/apps/openresty/openresty/conf/conf.d/meow.ali.minapp.xin.conf
- Proxy config: /www/sites/meow.ali.minapp.xin/proxy/proxy.conf
- Entry server on port 26401

## Unknowns
- Current actual status of /admin /web /api (need verification)
- What specific errors occur
- Whether builds exist in correct locations
- Entry server configuration details

## Decision Boundaries
- TBD: what OMX can decide without confirmation

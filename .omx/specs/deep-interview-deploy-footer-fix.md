# Deep Interview Spec: Deploy Fix & Footer Entry

## Metadata
- **Profile**: standard
- **Rounds**: 3
- **Final Ambiguity**: 0.15
- **Threshold**: 0.20
- **Context Type**: brownfield

## Current Status Verification

### Deployment Status (Curl Tests)
| Path | Status Code | Actual Content | Expected |
|------|-------------|----------------|----------|
| / | 200 | Landing page | ✅ Correct |
| /web/ | 200 | Web app | ✅ Correct |
| /admin/ | 200 | Landing page | ❌ Should be admin app |
| /api/health | 200 | API response | ✅ Correct |

### Root Cause Identified
- Server `/www/sites/meow.ali.minapp.xin/admin/index.html` is only 316 bytes (placeholder)
- Local `apps/admin/dist/` has proper build but may need rebuild/redeploy
- Nginx config uses `alias` directive with `try_files` - should work if files exist

## Intent
Fix /admin path to serve actual admin application, and add entry links in footer

## Desired Outcome
1. https://miao.ali.minapp.xin/admin serves actual admin React app
2. www.html footer contains visible entry links to /admin and /web

## In-Scope
1. Rebuild admin app with correct base path
2. Deploy admin build to server
3. Update www.html footer with entry links
4. Verify all paths work

## Out-of-Scope / Non-goals
- API changes
- Web app functionality changes
- SSL/Nginx config changes (already working)
- Entry server changes

## Decision Boundaries
- OMX can decide: exact link styling, placement within footer
- Need user confirmation: None - task is straightforward

## Constraints
- Must preserve existing SSL and nginx config
- Must use existing SSH key for deployment
- Must maintain current www.html design aesthetic

## Testable Acceptance Criteria
- [ ] curl https://miao.ali.minapp.xin/admin/ returns admin app HTML (not landing page)
- [ ] Admin app loads without 404 errors for assets
- [ ] Footer contains link to /admin (商家后台)
- [ ] Footer contains link to /web (创作者工作台)
- [ ] Links are visually consistent with footer design

## Technical Context
- Server: 139.224.105.241
- Remote path: /www/sites/meow.ali.minapp.xin/
- SSH key: /Users/ke/code/meow/ssh/139.224.105.241_20260404233402_id_rsa
- Local builds: apps/admin/dist/, apps/web/dist/

## Full Transcript
Round 1 | Target: current-status | Question: What is current status of /admin /web /api?
Answer: Verified via curl - / and /web and /api work (200), but /admin returns landing page instead of admin app

Round 2 | Target: root-cause | Question: Why does /admin return landing page?
Answer: Server admin/index.html is only 316 bytes placeholder; local dist exists but needs rebuild/redeploy

Round 3 | Target: footer-requirements | Question: What footer links are needed?
Answer: Add /admin (商家后台) and /web (创作者工作台) entry links in www.html footer

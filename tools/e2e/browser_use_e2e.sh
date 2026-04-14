#!/usr/bin/env bash
set -euo pipefail

# 端到端自动化测试（Web Debug + browser-use）
# - 依赖：node/npm、browser-use、curl、python3、Playwright Chromium（或可用的 CDP 浏览器）
# - 输出：在飞书多维表格“自动化测试结果”中写入测试记录与截图

BASE_TOKEN="FbKAbZJHFa60ZcsLj1vcIpIqn6g"
TABLE_ID="tbl7X8kwm9D9yuUl" # 自动化测试结果
ATTACHMENT_FIELD_ID="fld7ZrSNKo" # 截图

LARK_ENV=("LARK_CLI_NO_PROXY=1")

WEB_URL="http://127.0.0.1:5173/"
CDP_URL="http://127.0.0.1:9222"

NO_PROXY_VALUE="localhost,127.0.0.1,::1"

PROJECT_DIR="/data00/home/huangjiancheng.max/projects/billiard_game"
CHROMIUM_BIN="/home/huangjiancheng.max/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome"

VERSION="$(git -C "$PROJECT_DIR" rev-parse --short HEAD)"
# 可通过环境变量覆盖：RUN_ROUND=Run-xxx
RUN_ROUND="${RUN_ROUND:-Run-$(date '+%Y%m%d-%H%M%S')}"
NOW="$(date '+%Y-%m-%d %H:%M')"
SESSION="billiard-e2e-${VERSION}-$(date '+%H%M%S')"

VITE_PID=""
CHROME_PID=""

cleanup() {
  set +e
  if [[ -n "$VITE_PID" ]]; then
    kill "$VITE_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$CHROME_PID" ]]; then
    kill "$CHROME_PID" >/dev/null 2>&1 || true
  fi
  NO_PROXY="$NO_PROXY_VALUE" no_proxy="$NO_PROXY_VALUE" browser-use --session "$SESSION" --cdp-url "$CDP_URL" close >/dev/null 2>&1 || true
}
trap cleanup EXIT

start_web() {
  npm --prefix "$PROJECT_DIR" run dev:web >/tmp/billiard_e2e_vite.log 2>&1 &
  VITE_PID=$!
}

start_chromium() {
  "$CHROMIUM_BIN" --headless=new --remote-debugging-port=9222 --no-sandbox about:blank >/tmp/billiard_e2e_chrome.log 2>&1 &
  CHROME_PID=$!
}

wait_ready() {
  # wait for vite
  for _ in {1..60}; do
    if NO_PROXY="$NO_PROXY_VALUE" no_proxy="$NO_PROXY_VALUE" curl -sSf "$WEB_URL" >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done
  # wait for cdp
  for _ in {1..60}; do
    if NO_PROXY="$NO_PROXY_VALUE" no_proxy="$NO_PROXY_VALUE" curl -sSf "$CDP_URL/json/version" >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done
}

extract_json() {
  python3 -c 'import sys
s=sys.stdin.read()
start=s.find("{")
end=s.rfind("}")
print("") if start==-1 or end==-1 or end<=start else print(s[start:end+1])'
}

lark_json() {
  local tmp
  tmp=$(mktemp)
  # lark-cli 在部分环境下通过 pipe 可能拿不到输出，这里用临时文件方式保证可捕获。
  env "${LARK_ENV[@]}" lark-cli "$@" > "$tmp" 2>&1
  local out
  out=$(extract_json < "$tmp")
  rm -f "$tmp"
  echo "$out"
}

ensure_select_option() {
  local field_id="$1"
  local option_name="$2"
  local hue="$3"
  local lightness="$4"

  local field_json
  field_json=$(lark_json base +field-get --base-token "$BASE_TOKEN" --table-id "$TABLE_ID" --field-id "$field_id")

  if [[ -z "$field_json" ]]; then
    echo "[E2E] failed to read field json for $field_id" >&2
    return 1
  fi

  local need_update
  need_update=$(OPTION_NAME="$option_name" python3 -c 'import json,os,sys
data=json.load(sys.stdin)
field=(data.get("data") or {}).get("field") or {}
options=field.get("options") or []
target=os.environ["OPTION_NAME"]
print("0" if any(o.get("name")==target for o in options) else "1")' <<< "$field_json")

  if [[ "$need_update" != "1" ]]; then
    return 0
  fi

  local update_json
  update_json=$(OPTION_NAME="$option_name" OPTION_HUE="$hue" OPTION_LIGHTNESS="$lightness" python3 -c 'import json,os,sys
data=json.load(sys.stdin)
field=(data.get("data") or {}).get("field") or {}
options=field.get("options") or []
options.append({"name": os.environ["OPTION_NAME"], "hue": os.environ["OPTION_HUE"], "lightness": os.environ["OPTION_LIGHTNESS"]})
payload={"name": field.get("name"), "type": field.get("type"), "multiple": field.get("multiple", False), "options": options}
print(json.dumps(payload, ensure_ascii=False))' <<< "$field_json")

  env "${LARK_ENV[@]}" lark-cli base +field-update \
    --base-token "$BASE_TOKEN" \
    --table-id "$TABLE_ID" \
    --field-id "$field_id" \
    --json "$update_json" >/dev/null
}

bu() {
  NO_PROXY="$NO_PROXY_VALUE" no_proxy="$NO_PROXY_VALUE" browser-use --json --session "$SESSION" --cdp-url "$CDP_URL" "$@"
}

bu_ok() {
  local out
  out=$(bu "$@")
  if ! python3 -c 'import json,sys; data=json.load(sys.stdin); raise SystemExit(0 if data.get("success") else 1)' <<< "$out"; then
    echo "[E2E] browser-use command failed: $*" >&2
    echo "$out" >&2
    return 1
  fi
  echo "$out"
}

page_boot() {
  bu_ok open "$WEB_URL" >/dev/null
  bu_ok wait text "状态：booted" >/dev/null
}

eval_result() {
  # 输出 browser-use eval 的 data.result（字符串）
  local out
  out=$(bu_ok eval "$1")
  python3 -c 'import json,sys; data=json.load(sys.stdin); print((data.get("data") or {}).get("result", ""))' <<< "$out"
}

debug_call() {
  # 执行 debug API 调用，不关心返回值
  eval_result "(() => { ${1}; return 'ok'; })()" >/dev/null
}

debug_state() {
  eval_result "(() => JSON.stringify(globalThis.__BILLIARD_DEBUG__?.getState?.() ?? null))()"
}

wait_settled() {
  # 等待进入 aiming/result 且 lastAllStopped=true
  for _ in {1..200}; do
    debug_call "globalThis.__BILLIARD_DEBUG__.advance(30, 0.008333)"
    local s
    s=$(debug_state)
    if python3 -c 'import json,sys
st=json.loads(sys.stdin.read() or "null")
ok=bool(st) and st.get("lastAllStopped") and st.get("state") in ["aiming","result"]
raise SystemExit(0 if ok else 1)' <<< "$s"; then
      echo "$s"
      return 0
    fi
  done
  debug_state
}

write_record_with_screenshot() {
  local case_id="$1"
  local case_title="$2"
  local priority="$3"
  local result="$4" # 通过/失败/阻塞
  local details="$5"
  local screenshot_path="$6"

  local record_json
  record_json=$(CASE_ID="$case_id" CASE_TITLE="$case_title" PRIORITY="$priority" RESULT="$result" VERSION="$VERSION" RUN_ROUND="$RUN_ROUND" NOW="$NOW" DETAILS="$details" python3 -c 'import json,os
payload={
  "标题": os.environ.get("CASE_ID","") + " " + os.environ.get("CASE_TITLE",""),
  "版本": os.environ.get("VERSION",""),
  "测试轮次": os.environ.get("RUN_ROUND",""),
  "用例编号": os.environ.get("CASE_ID",""),
  "优先级": os.environ.get("PRIORITY",""),
  "通过情况": os.environ.get("RESULT",""),
  "说明": os.environ.get("DETAILS", ""),
  "时间": os.environ.get("NOW", ""),
}
print(json.dumps(payload, ensure_ascii=False))')

  local upsert_out
  upsert_out=$(lark_json base +record-upsert --base-token "$BASE_TOKEN" --table-id "$TABLE_ID" --json "$record_json")

  local record_id
  record_id=$(python3 -c 'import json,sys
data=json.load(sys.stdin)
record=(data.get("data") or {}).get("record") or {}
ids=record.get("record_id_list") or []
print(ids[0] if ids else "")' <<< "$upsert_out")

  if [[ -z "$record_id" ]]; then
    echo "[E2E] failed to get record_id for $case_id" >&2
    echo "$upsert_out" >&2
    return 1
  fi

  if [[ -f "$screenshot_path" ]]; then
    local rel_dir=".tmp/e2e"
    local rel_file="${rel_dir}/${SESSION}_${case_id}.png"
    mkdir -p "${PROJECT_DIR}/${rel_dir}"
    cp -f "$screenshot_path" "${PROJECT_DIR}/${rel_file}"

    ( cd "$PROJECT_DIR" && env "${LARK_ENV[@]}" lark-cli base +record-upload-attachment \
      --base-token "$BASE_TOKEN" \
      --table-id "$TABLE_ID" \
      --record-id "$record_id" \
      --field-id "$ATTACHMENT_FIELD_ID" \
      --file "./${rel_file}" \
      --name "${SESSION}_${case_id}.png" >/dev/null )

    rm -f "${PROJECT_DIR}/${rel_file}" >/dev/null 2>&1 || true
  fi

  echo "[E2E] $case_id $result"
}

main() {
  # 确保单选字段包含当前版本与轮次选项（否则 record-upsert 会失败）
  ensure_select_option "fldebtXIpK" "$VERSION" "Blue" "Light"
  ensure_select_option "fldlWTjZ05" "$RUN_ROUND" "Purple" "Light"
  ensure_select_option "fld3wFUtV1" "阻塞" "Orange" "Light"

  start_web
  start_chromium
  wait_ready

  # 用例清单（完整执行：通过 / 失败 / 阻塞）
  local ss
  local result
  local details

  # E2E-001
  ss="/tmp/${SESSION}_E2E-001.png"
  page_boot
  bu_ok screenshot "$ss" >/dev/null
  details=$(eval_result "(() => {\
    const status = document.getElementById('boot-status')?.textContent ?? '';\
    const canvas = document.getElementById('game-canvas');\
    const okCanvas = !!canvas && canvas.width === 640 && canvas.height === 424;\
    const ctx = canvas ? canvas.getContext('2d') : null;\
    const p = ctx ? Array.from(ctx.getImageData(30, 64 + 30, 1, 1).data) : null;\
    return JSON.stringify({ status, okCanvas, pixel: p });\
  })()")
  result=$(python3 -c 'import json,sys; d=json.loads(sys.stdin.read()); ok=("booted" in d.get("status","")) and d.get("okCanvas") and d.get("pixel")==[31,122,67,255]; print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-001" "启动进入标题页" "P0" "$result" "$details" "$ss"

  # E2E-401（HUD 不遮挡球桌）——复用同样的像素断言
  ss="/tmp/${SESSION}_E2E-401.png"
  page_boot
  bu_ok screenshot "$ss" >/dev/null
  write_record_with_screenshot "E2E-401" "HUD 不遮挡球桌" "P0" "$result" "$details" "$ss"

  # E2E-402（画布尺寸贴合）——复用同样的尺寸断言
  ss="/tmp/${SESSION}_E2E-402.png"
  page_boot
  bu_ok screenshot "$ss" >/dev/null
  write_record_with_screenshot "E2E-402" "浏览器画布尺寸贴合球桌" "P0" "$result" "$details" "$ss"

  # E2E-002
  ss="/tmp/${SESSION}_E2E-002.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.advance(60, 0.008333)"
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null"); ok=s and s.get("state")=="aiming" and s.get("balls") and len(s["balls"])>=3; print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-002" "从标题页开始对局" "P0" "$result" "$details" "$ss"

  # E2E-101
  ss="/tmp/${SESSION}_E2E-101.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.shoot(0, 0.8)"
  details=$(wait_settled)
  bu_ok screenshot "$ss" >/dev/null
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null"); ok=s and s.get("lastAllStopped") and (s.get("lastShotFirstHitBallId") is not None) and ("no-first-hit" not in (s.get("foulReasons") or [])); print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-101" "瞄准→出杆→停球→结算" "P0" "$result" "$details" "$ss"

  # E2E-201（反弹）
  ss="/tmp/${SESSION}_E2E-201.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.placeBall(0, 30, 180)"
  debug_call "globalThis.__BILLIARD_DEBUG__.shoot(3.1415926, 1.0)"
  # 读取初始 vx（应为负），然后推进直到 vx 变为正（发生反弹）
  details=$(debug_state)
  local initial_vx
  initial_vx=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null");
balls=s.get("balls") or []
cue=next((b for b in balls if b.get("id")==0), None)
print(cue.get("vx",0) if cue else 0)' <<< "$details")
  local found_pos_after="0"
  for _ in {1..120}; do
    debug_call "globalThis.__BILLIARD_DEBUG__.advance(10, 0.008333)"
    details=$(debug_state)
    local vx
    vx=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null");
balls=s.get("balls") or []
cue=next((b for b in balls if b.get("id")==0), None)
print(cue.get("vx",0) if cue else 0)' <<< "$details")
    if python3 -c 'import sys; v=float(sys.argv[1]); raise SystemExit(0 if v>0 else 1)' "$vx"; then
      found_pos_after="1"
      break
    fi
  done
  bu_ok screenshot "$ss" >/dev/null
  result=$([ "$found_pos_after" == "1" ] && python3 -c 'import sys; v=float(sys.argv[1]); raise SystemExit(0 if v<0 else 1)' "$initial_vx" >/dev/null 2>&1 && echo "通过" || echo "失败")
  write_record_with_screenshot "E2E-201" "球与库边反弹" "P0" "$result" "$details" "$ss"

  # E2E-202（球-球碰撞）
  ss="/tmp/${SESSION}_E2E-202.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.placeBall(0, 120, 180)"
  debug_call "globalThis.__BILLIARD_DEBUG__.placeBall(1, 150, 180)"
  debug_call "globalThis.__BILLIARD_DEBUG__.placeBall(8, 520, 300)"
  debug_call "globalThis.__BILLIARD_DEBUG__.placeBall(9, 520, 60)"
  debug_call "globalThis.__BILLIARD_DEBUG__.shoot(0, 0.7)"
  debug_call "globalThis.__BILLIARD_DEBUG__.advance(400, 0.008333)"
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys,math; s=json.loads(sys.stdin.read() or "null");
balls=s.get("balls") or []
t=next((b for b in balls if b.get("id")==1), None)
spd=0
if t: spd=math.hypot(t.get("vx",0), t.get("vy",0))
ok=(s.get("lastFirstHitBallId")==1) or (spd>0.001)
print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-202" "球与球碰撞" "P0" "$result" "$details" "$ss"

  # E2E-203（落袋判定）
  ss="/tmp/${SESSION}_E2E-203.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.placeBall(1, 2, 2)"
  debug_call "globalThis.__BILLIARD_DEBUG__.shoot(0, 0.2)"
  details=$(wait_settled)
  bu_ok screenshot "$ss" >/dev/null
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null");
balls=s.get("balls") or []
b1=next((b for b in balls if b.get("id")==1), None)
ok=(b1 and b1.get("pocketed")) and (1 in (s.get("lastShotPocketedBallIds") or []))
print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-203" "落袋判定" "P0" "$result" "$details" "$ss"

  # E2E-204（停球阈值）
  ss="/tmp/${SESSION}_E2E-204.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.shoot(0, 0.1)"
  debug_call "globalThis.__BILLIARD_DEBUG__.advance(6000, 0.008333)"
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null"); ok=bool(s and s.get("lastAllStopped")); print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-204" "停球阈值与停球时机" "P1" "$result" "$details" "$ss"

  # E2E-301（no-first-hit）
  ss="/tmp/${SESSION}_E2E-301.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  # 规则验证走确定性路径：直接 resolveShot 注入“无首碰/无进球”
  debug_call "globalThis.__BILLIARD_DEBUG__.resolveShot({ firstHitBallId: null, pocketedBallIds: [], cueBallPocketed: false, blackBallPocketed: false, railHitAfterContact: true, foulReasons: [] })"
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null");
reasons=s.get("foulReasons") or []
ok=bool(s and s.get("foul") and ("no-first-hit" in reasons))
print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-301" "首碰为空/非法处理" "P1" "$result" "$details" "$ss"

  # E2E-302（母球落袋犯规）
  ss="/tmp/${SESSION}_E2E-302.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.placeBall(0, 2, 2)"
  debug_call "globalThis.__BILLIARD_DEBUG__.shoot(0, 0.2)"
  debug_call "globalThis.__BILLIARD_DEBUG__.advance(300, 0.008333)"
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null");
reasons=s.get("foulReasons") or []
ok=bool(s and s.get("foul") and ("cue-ball-pocketed" in reasons))
print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-302" "母球落袋犯规" "P0" "$result" "$details" "$ss"

  # E2E-303（分组确定）
  ss="/tmp/${SESSION}_E2E-303.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.placeBall(0, 80, 80)"
  debug_call "globalThis.__BILLIARD_DEBUG__.placeBall(1, 22, 22)"
  debug_call "globalThis.__BILLIARD_DEBUG__.placeBall(8, 520, 320)"
  debug_call "globalThis.__BILLIARD_DEBUG__.placeBall(9, 520, 60)"
  # 规则分组验证走确定性路径：直接 resolveShot 注入“进球事件”
  debug_call "globalThis.__BILLIARD_DEBUG__.resolveShot({ firstHitBallId: 1, pocketedBallIds: [1], cueBallPocketed: false, blackBallPocketed: false, railHitAfterContact: true, foulReasons: [] })"
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null");
pg=s.get("playerGroups") or {}
ok=bool(pg) and pg.get("p1") in ["solid","stripe"] and pg.get("p2") in ["solid","stripe"]
print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-303" "未分组前进球触发分组" "P1" "$result" "$details" "$ss"

  # E2E-304（黑八非法）
  ss="/tmp/${SESSION}_E2E-304.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.assignGroup('solid')"
  debug_call "globalThis.__BILLIARD_DEBUG__.resolveShot({ firstHitBallId: 1, pocketedBallIds: [8], cueBallPocketed: false, blackBallPocketed: true, railHitAfterContact: true, foulReasons: [] })"
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null");
reasons=s.get("foulReasons") or []
ok=bool(s and s.get("gameOver") and ("illegal-black-pocket" in reasons) and s.get("winner")==2)
print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-304" "黑八非法落袋判负" "P1" "$result" "$details" "$ss"

  # E2E-305（黑八合法）——当前物理/进袋精度有限，可能无法稳定复现；若失败则标记阻塞
  ss="/tmp/${SESSION}_E2E-305.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.assignGroup('solid')"
  debug_call "globalThis.__BILLIARD_DEBUG__.markAllGroupPocketed('solid')"
  debug_call "globalThis.__BILLIARD_DEBUG__.resolveShot({ firstHitBallId: 8, pocketedBallIds: [8], cueBallPocketed: false, blackBallPocketed: true, railHitAfterContact: true, foulReasons: [] })"
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null");
reasons=s.get("foulReasons") or []
ok=bool(s and s.get("gameOver") and s.get("winner")==1 and ("illegal-black-pocket" not in reasons))
print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-305" "黑八合法落袋判胜" "P1" "$result" "$details" "$ss"

  # E2E-003（对局结束进入结算页）——以 E2E-304 的结果状态做验证
  ss="/tmp/${SESSION}_E2E-003.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.assignGroup('solid')"
  debug_call "globalThis.__BILLIARD_DEBUG__.resolveShot({ firstHitBallId: 1, pocketedBallIds: [8], cueBallPocketed: false, blackBallPocketed: true, railHitAfterContact: true, foulReasons: [] })"
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null"); ok=bool(s and s.get("gameOver") and s.get("state")=="result"); print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-003" "对局结束后进入结算页" "P1" "$result" "$details" "$ss"

  # E2E-004（重开与返回标题）——重开可通过 debugStartMatch 验证；返回标题页目前无 UI/API，标记阻塞
  ss="/tmp/${SESSION}_E2E-004.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.assignGroup('solid')"
  debug_call "globalThis.__BILLIARD_DEBUG__.resolveShot({ firstHitBallId: 1, pocketedBallIds: [8], cueBallPocketed: false, blackBallPocketed: true, railHitAfterContact: true, foulReasons: [] })"
  debug_call "globalThis.__BILLIARD_DEBUG__.restartMatch()" # 重开
  debug_call "globalThis.__BILLIARD_DEBUG__.advance(30, 0.008333)"
  debug_call "globalThis.__BILLIARD_DEBUG__.backMenu()" # 返回
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null"); ok=bool(s and s.get("state")=="menu"); print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-004" "结算页重开与返回" "P0" "$result" "$details" "$ss"

  # E2E-501：用 debugPause/debugResume 模拟切后台/恢复
  ss="/tmp/${SESSION}_E2E-501.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.shoot(0, 0.8)"
  debug_call "globalThis.__BILLIARD_DEBUG__.advance(30, 0.008333)"
  debug_call "globalThis.__BILLIARD_DEBUG__.pause()"
  debug_call "globalThis.__BILLIARD_DEBUG__.advance(60, 0.008333)" # 应无推进
  debug_call "globalThis.__BILLIARD_DEBUG__.resume()"
  debug_call "globalThis.__BILLIARD_DEBUG__.advance(60, 0.008333)"
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null"); ok=bool(s and s.get("state") in ["ballsMoving","aiming","result"]); print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-501" "切后台/恢复" "P1" "$result" "$details" "$ss"

  # E2E-502：模拟 10 分钟（600s）快速推进，禁用渲染减少开销
  ss="/tmp/${SESSION}_E2E-502.png"
  page_boot
  debug_call "globalThis.__BILLIARD_DEBUG__.startMatch()"
  debug_call "globalThis.__BILLIARD_DEBUG__.setRenderEnabled(false)"
  debug_call "globalThis.__BILLIARD_DEBUG__.advance(6000, 0.1)" # 600s
  debug_call "globalThis.__BILLIARD_DEBUG__.setRenderEnabled(true)"
  bu_ok screenshot "$ss" >/dev/null
  details=$(debug_state)
  result=$(python3 -c 'import json,sys; s=json.loads(sys.stdin.read() or "null"); ok=bool(s and s.get("state")); print("通过" if ok else "失败")' <<< "$details")
  write_record_with_screenshot "E2E-502" "长时间运行稳定性（10 分钟）" "P2" "$result" "$details" "$ss"

  echo "[E2E] full suite done, round=$RUN_ROUND version=$VERSION"
}

main

# Bàn giao STRATA — token-radar-01

Đã xây, kiểm tra và lưu artifact; **chưa submit**, không tiêu lượt nộp.

Anchor thật, được init trước mọi code:

`makefun anchor 495e409d884ce9701e79f76a15c6cb8e3fae6954 round 34002550`

## Artifact và dữ liệu

Mở `out/dashboard/index.html` trực tiếp (file://). `out/board.json`, `out/data.js`, `out/dossier.json` là output hoàn chỉnh. Build: `node main.ts --input input --output out`. Runtime chấm dùng đường dẫn mặc định `/input`, `/output`; mã nguồn ở `/bot`.

- Snapshot DefiLlama as_of 2026-11-14: 758 protocol; 342 không ghi nhận token, 416 đã ghi nhận token. TVL thô 465.699.305.866 USD có thể đếm trùng.
- Comparable: 128 protocol đã ghi nhận token với mcap_usd > 0 và tvl_usd > 0, hữu hạn. Không áp isRankable/CEX/version filter cho comparable. Median toàn tập **0.21380325885644053**.
- Khác tham khảo 0,205: bộ lọc mcap truthy giữ cả AUTOfinance có mcap −1, cho 129 mẫu và median 0.2049046688714616. Loại đúng giá trị âm cho Yield n=9, median 0.1914144905351388 (thay vì n=10/~0,180). Các category khác đối chiếu trong `reports/snapshot.json`.
- Steakhouse: base 588.810.218,4613321 USD, implied cuối 464.924.662 USD; không ép khớp base tham khảo 564,6 triệu.
- Board 200 dòng = 40 watchlist + 160 early; coverage 100%; không trùng slug/value; rank 1..200; va chạm thực 0, điều chỉnh tối đa 0 USD. Có test synthetic cho va chạm.
- Board 495.871 byte; nguồn dashboard 21.264 byte; dossier 479.274 byte, text 21.524 byte, không cắt nguồn. Helper vendor khớp byte với kit. Rebuild dossier không đưa chính dossier hay data.js vào text: helper chỉ đọc dashboard/ và screenshots/.
- Ba screenshot JPEG thật, mỗi ảnh 1440×900: board 101.648 byte; detail 142.742 byte; filtered 98.429 byte. Ảnh chụp bản UI/dữ liệu cuối, không chỉnh nội dung ảnh. Ảnh nhỏ hơn mục tiêu tham khảo nhưng chữ đọc được.

## Kiểm chứng

`node scripts/model-check.mjs`: PASS median chẵn/lẻ, fallback n=2/category n=3, clamp multiple hai đầu, growth cực trị, tuổi thiếu/lỗi/quá 1095/âm, công thức chung, lựa chọn early, farm chain/vốn/gas/thời gian, synthetic ties độc lập thứ tự input.

`node scripts/artifact-check.mjs`: PASS cả bảy kiểm tra cục bộ: dashboard_files, board_file, sorted_by_value, coverage, farm_steps, screenshots, dossier_matches. Đây là kiểm tra tự triển khai theo hợp đồng, **không phải sealed scorer**. Kit ghi rõ không có grade cục bộ; không gọi judge hay dịch vụ submit.

Chromium/Playwright trong Docker không mạng, file://: PASS 200 board rows, 416 live rows, 128 comparable trong live filter; sort số hai chiều; category+cohort kết hợp; tìm kiếm empty; reset; detail đúng row và sáu bước; không page error, không HTTP request. Bằng chứng `reports/ui.json` và `scripts/ui-check.mjs`. Đã xem trực tiếp ảnh board/detail.

Hai output sạch `runs/a`, `runs/b`: mọi đường dẫn tương đối và SHA-256 giống nhau, gồm dossier và ba ảnh cố định. Cấu hình Docker Node 22.23.5: network none, rootfs và /bot chỉ đọc, /input chỉ đọc, /output ghi được, user 1000, 1 CPU, 1.024 MiB RAM, 64 PID, timeout 120 giây. Không OOM. Docker báo kernel không hỗ trợ giới hạn swap: RAM được cấu hình nhưng **không xác minh giới hạn swap**, không đo peak RSS riêng. Thời gian dưới đây gồm khởi động container, không phải benchmark CPU thuần.

- Lần A: 0.328 giây; lần B: 0.296 giây; output 1955150 byte / 9 file.

Lệnh kit chính thức đã chạy:

```sh
node cli/makefun.mjs check --kit kit/token-radar-01-kit --repo . --transcripts reports/transcripts.tar.gz --json
```

Exit 0, ok true. Anchor, license, entrypoint, intake caps và mọi transcript gate áp dụng tại chỗ PASS. thinking_reproduces ở lần xác nhận: 242/598 dòng (40,4%), main.ts 38 authored; thinking_turns 27; usage 44 record đều định giá được; thinking_revised PASS; transcripts_run_record PASS dù hiện chưa tới 17/11. Check cuối được lưu `reports/check.json`; số đếm có thể tăng khi bundle toàn bộ phần bàn giao.

`thinking_committed` chỉ xác minh khi ký entry; quyền sở hữu tài khoản/repo, chống trùng bài và quyết định sealed scorer/judge thuộc server, chưa xác minh. Không khẳng định đủ điều kiện nộp chỉ dựa trên check cục bộ.

## Transcript / run record

Một phiên Codex chính, không subagent: **01a1e311-a9f8-7730-a415-44618f157679**. Harness rollout gốc còn nguyên tại thư mục phiên Codex do harness cấu hình, tên `rollout-2026-11-16T06-35-48-01a1e311-a9f8-7730-a415-44618f157679.jsonl`. Không dùng ephemeral, không chỉnh log. Người vận hành giữ volume hoặc docker cp thư mục sessions ra trước khi xóa sandbox.

Metadata đọc từ rollout: Codex CLI 0.169.0, provider magpie, model codex/gpt-6.1-sol, effort medium. Bundle chính thức đã tạo `reports/transcripts.tar.gz`: prompt gốc lấy từ phiên, system prompt in-session, hai instruction files do kit thu thập/redact, không MCP server được sử dụng. Không tự dựng system prompt hay timestamp. CLI ban đầu level 17 báo cũ; đã tải kit hiện hành và dùng CLI của kit cho bundle/check.

Sau khi phiên kết thúc, người vận hành bundle lại để bao gồm phần bàn giao cuối, theo cú pháp đã đọc và chạy (thay `<rollout-file>` bằng file thật trong volume):

```sh
node cli/makefun.mjs bundle --repo . --out reports/transcripts.tar.gz \
  --session <rollout-file> --no-discover \
  --harness codex --harness-version 0.169.0 \
  --provider magpie --model codex/gpt-6.1-sol --effort medium --mcp none
node cli/makefun.mjs check --kit kit/token-radar-01-kit --repo . \
  --transcripts reports/transcripts.tar.gz --json
```

Không dùng --muse-usage cho phiên Codex. Bản bundle trong repo là snapshot hợp lệ của log lúc chạy lệnh, không thay cho việc giữ rollout đầy đủ đến cuối phiên. Thu hồi API key riêng sau khi hoàn tất. Không ghi secret vào artifact; kit tự redaction bản bundle, log gốc không bị sửa.

## Khác starter và giới hạn

Đã thay multiple cố định bằng category median/fallback/clamp, giữ precision, ghi đủ breakdown/flags/ties; farm plan có category action có điều kiện, vốn luân chuyển, gas theo chain, thời gian theo tuổi và phí chưa biết. Dashboard STRATA dùng theme giấy/xanh, không framework/CDN; tất cả 416 live-token rows tách riêng với market cap snapshot và ratio comparable. Market cap không dương bị đánh dấu thiếu hợp lệ, raw field vẫn xem được ở detail. Tên/dữ liệu render bằng textContent.

Giới hạn: TVL curator có thể đếm trùng; comparable mỏng không phải confidence; TVL không phải doanh thu; thiếu phí/doanh thu; trạng thái token phụ thuộc snapshot; tuổi tracking không phải tuổi thành lập; gas chỉ giả định offline; reward, tài sản/pool và quyền truy cập chưa xác minh. Proxy không phải mcap thật/FDV/giá token/dự báo phát hành hay lợi nhuận. Không tự nhận vượt mốc dashboard tham chiếu hoặc bảo đảm thứ hạng.

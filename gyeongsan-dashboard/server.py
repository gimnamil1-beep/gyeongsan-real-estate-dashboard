"""경산행운부동산 대시보드 로컬 서버 — 외부 패키지 없이 실행됩니다."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen
import json
import os

ROOT = Path(__file__).parent / "public"
PORT = int(os.environ.get("PORT", "4173"))
LAWD_CODE = "47290"


class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, payload, status=200):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/status":
            return self.send_json({
                "dataGoKr": bool(os.environ.get("DATA_GO_KR_API_KEY")),
                "reb": bool(os.environ.get("REB_API_KEY")),
                "region": "경상북도 경산시",
                "lawdCode": LAWD_CODE,
            })
        if parsed.path == "/api/trades":
            return self.handle_trades(parse_qs(parsed.query))
        return super().do_GET()

    def handle_trades(self, query):
        key = os.environ.get("DATA_GO_KR_API_KEY")
        if not key:
            return self.send_json({"mode": "sample", "reason": "API 키 미설정", "items": []})
        deal_ymd = "".join(filter(str.isdigit, query.get("dealYmd", [""])[0]))[:6]
        trade_type = query.get("type", ["sale"])[0]
        dong = query.get("dong", ["전체"])[0]
        service = "RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev" if trade_type == "sale" else "RTMSDataSvcAptRent/getRTMSDataSvcAptRent"
        params = urlencode({
            "serviceKey": key,
            "LAWD_CD": LAWD_CODE,
            "DEAL_YMD": deal_ymd,
            "pageNo": 1,
            "numOfRows": 500,
            "resultType": "json",
        })
        url = f"https://apis.data.go.kr/1613000/{service}?{params}"
        try:
            request = Request(url, headers={"Accept": "application/json", "User-Agent": "GyeongsanLuckyDashboard/1.0"})
            with urlopen(request, timeout=9) as response:
                payload = json.loads(response.read().decode("utf-8"))
            items = payload.get("response", {}).get("body", {}).get("items", {}).get("item", [])
            if isinstance(items, dict):
                items = [items]
            if dong != "전체":
                stem = dong.rstrip("읍면동")
                items = [item for item in items if stem in str(item.get("umdNm", item.get("UMD_NM", "")))]
            return self.send_json({"mode": "live", "source": "국토교통부 실거래가 공개시스템", "items": items})
        except Exception as error:
            return self.send_json({"mode": "sample", "reason": str(error), "items": []})


if __name__ == "__main__":
    print(f"경산행운부동산 대시보드: http://localhost:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), DashboardHandler).serve_forever()

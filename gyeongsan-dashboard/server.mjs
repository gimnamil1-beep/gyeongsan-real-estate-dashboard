import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./public/", import.meta.url));
const port = Number(process.env.PORT || 4173);
const lawdCode = "47290";
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

function normalizeItems(payload) {
  const items = payload?.response?.body?.items?.item ?? [];
  return Array.isArray(items) ? items : [items];
}

async function realEstateApi(url) {
  const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(9000) });
  if (!response.ok) throw new Error(`공공데이터 API ${response.status}`);
  const text = await response.text();
  if (text.trim().startsWith("<")) throw new Error("공공데이터 API가 XML 오류를 반환했습니다.");
  return JSON.parse(text);
}

async function handleTrades(req, res) {
  const key = process.env.DATA_GO_KR_API_KEY;
  if (!key) return json(res, 200, { mode: "sample", reason: "API 키 미설정", items: [] });
  const input = new URL(req.url, "http://localhost");
  const dealYmd = (input.searchParams.get("dealYmd") || new Date().toISOString().slice(0, 7).replace("-", "")).replace(/\D/g, "").slice(0, 6);
  const type = input.searchParams.get("type") || "sale";
  const dong = input.searchParams.get("dong") || "전체";
  const service = type === "sale" ? "RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev" : "RTMSDataSvcAptRent/getRTMSDataSvcAptRent";
  const url = new URL(`https://apis.data.go.kr/1613000/${service}`);
  url.searchParams.set("serviceKey", key);
  url.searchParams.set("LAWD_CD", lawdCode);
  url.searchParams.set("DEAL_YMD", dealYmd);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "500");
  url.searchParams.set("resultType", "json");
  try {
    const payload = await realEstateApi(url);
    const items = normalizeItems(payload).filter(item => dong === "전체" || String(item.umdNm || item.UMD_NM || "").includes(dong.replace(/읍|면|동$/g, "")));
    return json(res, 200, { mode: "live", source: "국토교통부 실거래가 공개시스템", updatedAt: new Date().toISOString(), items });
  } catch (error) {
    return json(res, 200, { mode: "sample", reason: error.message, items: [] });
  }
}

async function serveStatic(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = normalize(join(root, requested));
  if (!target.startsWith(normalize(root))) return json(res, 403, { error: "forbidden" });
  try {
    const info = await stat(target);
    const file = info.isDirectory() ? join(target, "index.html") : target;
    const content = await readFile(file);
    res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    res.end(content);
  } catch {
    const content = await readFile(join(root, "index.html"));
    res.writeHead(200, { "content-type": mime[".html"] });
    res.end(content);
  }
}

createServer(async (req, res) => {
  if (req.url?.startsWith("/api/trades")) return handleTrades(req, res);
  if (req.url === "/api/status") return json(res, 200, { dataGoKr: Boolean(process.env.DATA_GO_KR_API_KEY), reb: Boolean(process.env.REB_API_KEY), region: "경상북도 경산시", lawdCode });
  return serveStatic(req, res);
}).listen(port, "127.0.0.1", () => console.log(`경산행운부동산 대시보드: http://localhost:${port}`));

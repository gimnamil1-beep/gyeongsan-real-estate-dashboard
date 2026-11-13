# 경산행운부동산 — 경산시 부동산 대시보드

공인중개사의 고객 브리핑을 위한 경산시 아파트 실거래 대시보드입니다.

## 실행

PowerShell에서 환경변수를 현재 세션에 넣고 실행합니다. 이 프로젝트는 PowerShell만으로 바로 실행할 수 있으며, Node.js 또는 Python이 있는 환경도 지원합니다.

```powershell
$env:DATA_GO_KR_API_KEY="발급받은_공공데이터포털_키"
$env:REB_API_KEY="발급받은_한국부동산원_키"
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

Node.js 방식:

```powershell
$env:DATA_GO_KR_API_KEY="발급받은_공공데이터포털_키"
$env:REB_API_KEY="발급받은_한국부동산원_키"
npm start
```

Python 방식:

```powershell
$env:DATA_GO_KR_API_KEY="발급받은_공공데이터포털_키"
$env:REB_API_KEY="발급받은_한국부동산원_키"
py -3 server.py
```

브라우저에서 `http://localhost:4173`을 엽니다. 키가 없거나 API가 일시적으로 응답하지 않으면 브리핑용 샘플 데이터가 표시되고, 화면 상단에 `샘플 데이터` 상태가 표시됩니다.

## 데이터 연결

- 공공데이터포털 국토교통부 아파트 매매·전월세 실거래 API를 서버에서 호출합니다.
- 키는 브라우저 번들에 포함되지 않으며 서버 환경변수로만 읽습니다.
- 현재 행정구역 코드는 경산시 `47290`으로 고정되어 있습니다.
- 한국부동산원 키는 서버 환경에 준비되며, 추후 R-ONE 지표 API 엔드포인트를 확정하면 시장지표 카드에 연결할 수 있습니다.

실거래 금액과 추천매물 정보는 계약 전 반드시 원문 및 등기·공부로 재확인하세요.

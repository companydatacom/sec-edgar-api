# US SEC EDGAR API by CompanyData

[![npm](https://img.shields.io/npm/v/@companydata/sec-edgar-api.svg)](https://www.npmjs.com/package/@companydata/sec-edgar-api)

A small, typed TypeScript wrapper for looking up **US company data from state registers and SEC EDGAR**: company names, full street addresses, phone, email, website, size and revenue, through one REST call.

This package is a thin convenience layer over the master [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk). It is the same API and the same key, with the country pinned to the United States and a register-specific helper on top, so you can write `client.getByRegistrationNumber("0806592")` instead of assembling query parameters by hand.

> One schema, one key. Every CompanyData register wrapper returns records in the same shape, so moving from the US state registers to another country's register is a one-line change.

## At a glance

| | |
| --- | --- |
| Country | 🇺🇸 United States (`countryCode: "US"`) |
| Register | US company registers (state filings and SEC EDGAR) |
| Businesses in CompanyData | 64.6M |
| With phone number | 27.1M |
| With email address | 9.53M |
| Lookup key | state registration number (state filing number, not unique nationwide) |
| Verified example | Apple Inc., `0806592` |
| Live demo and comparison | [companydata.com/sec-edgar-api](https://companydata.com/sec-edgar-api/) |
| Official register | [sec.gov/edgar](https://www.sec.gov/edgar) |

Counts are from the live API on 2026-10-12 and grow over time.

## What is SEC EDGAR?

**SEC EDGAR** is the US Securities and Exchange Commission's filing system. Its free API at [sec.gov/edgar](https://www.sec.gov/edgar) returns filings and company facts for any SEC registrant by CIK. The US has no national company register: companies are formed and registered state by state.

What EDGAR does **not** give you: it only covers SEC filers (a few thousand public companies and funds), so the 30M+ private US businesses are absent, and even for filers there is no phone number, no email address and no way to filter by city, industry or size. The 50 state registers each have their own portal and format.

**CompanyData adds the missing fields.** 64.6M US businesses with full addresses, phone, email, website, directors and firmographics, filterable and exportable in bulk through one live REST API. Comparison and a live lookup: [companydata.com/sec-edgar-api](https://companydata.com/sec-edgar-api/).

## Installation

```bash
npm install @companydata/sec-edgar-api
```

Get an API key at [app.companydata.com/signup-api](https://app.companydata.com/signup-api). Your first calls are free.

## Quickstart

```ts
import { SecEdgarClient } from "@companydata/sec-edgar-api";

const client = new SecEdgarClient({
  auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! }
});

// Look up one business by its state registration number.
const company = await client.getByRegistrationNumber("0806592", { regionName: "California" }); // Apple Inc.

// Search with filters (country is always US here).
const page = await client.search({
  cityName: "NEW YORK",
  hasEmail: true,
  hasWebsite: true,
  page: 1,
  pageSize: 25
});
console.log(page.totalCount, page.records[0]?.["Company Name"]);
```

> **City and province names are UPPER CASE.** Filter on `cityName: "NEW YORK"`, not `"New york"` (which returns 0). The same goes for `provinceName: "SANTA CLARA"`. List exact names per country with `GET /api/cities`. Full field and filter reference: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

Run the full example against the live API with your key:

```bash
git clone https://github.com/companydatacom/sec-edgar-api && cd sec-edgar-api && npm install
COMPANYDATA_API_KEY=... npm run test:live
```

## What a record looks like

Every record is a flat object with human-readable keys. This is Apple Inc. as returned by `getByRegistrationNumber`:

```json
{
  "Company Name": "Apple INC.",
  "Trade Name": "Apple",
  "Company Registration Number": "0806592",
  "Address 1": "1 Apple Park Way",
  "Postal Code": "95014-0642",
  "City": "Cupertino",
  "State/Province": "Santa Clara",
  "Country": "USA",
  "Phone Number": "+1*****10",
  "Email": "*****@*****",
  "Website": "apple.*****",
  "Founding Year": 1977,
  "Employees Total": 166000,
  "Yearly Revenue in U.S. Dollars": 416161000000,
  "Business Category Code 1 - Description": "Radio and Television Broadcasting and Communications Equipment",
  "Business Legal Type - Description": "Corporation"
}
```

**Search is a preview, export is the full record.** `search` (and the lookup helper, which uses it) returns about 20 fields with phone, email and website masked as `*****`, and does not spend credits. `export`, `exportWithScroll` and `iterate` return the full record (about 35 fields, unmasked contact details, SIC and national industry codes, legal status, group structure) and spend one credit per company you have not exported before. Which fields are on a record depends on your key's configuration. See the [field reference](https://companydata.com/api-docs/request-company/) and [plans and credits](https://companydata.com/api-docs/authentication/).

## Methods

| Method | Returns | Does |
| --- | --- | --- |
| `client.search(params)` | `SecEdgarPage` | Search US businesses with filters. |
| `client.getByRegistrationNumber(id, scope?)` | `CompanyRecord \| null` | Fetch one business by state registration number. `scope` adds extra filters when a number is not unique. |
| `client.export(params)` | `SecEdgarPage` | Export one page of results (standard pagination). |
| `client.exportWithScroll(params)` | `SecEdgarScrollBatch` | One scroll batch (max 50 records). Pass `scrollId` back in for the next. |
| `client.iterate(params, { maxRecords })` | `AsyncGenerator<CompanyRecord>` | Streams every matching record across scroll batches. |
| `client.raw` | `ApiClient` | The underlying master SDK client, for anything not wrapped here. |
| `normalizeSecEdgarId(id)` | `string` | The state registration number normalisation the lookup helper applies. |

```ts
interface SecEdgarPage {
  records: CompanyRecord[];   // flat objects, keys like "Company Name", "City", "Email"
  totalCount: number;         // matches across all pages
  page: number;
  totalPages: number;
  pageSize: number;
}

interface SecEdgarScrollBatch {
  records: CompanyRecord[];
  scrollId: string | null;    // pass back in to get the next batch
  hasMoreRecords: boolean;
  pageSize: number;
}
```

`params` is the master SDK's filter set with `countryCode` removed, because it is always `"US"` here. For cross-border queries, use the master SDK directly.

### Lookup by state registration number

`getByRegistrationNumber` takes the state corporate filing number CompanyData stores as `Company Registration Number`. Whitespace is stripped. **These numbers are only unique within a state**, so pass `regionName` (the state, in Title Case) as the second argument to pin the lookup: `getByRegistrationNumber("0806592", { regionName: "California" })`. The SEC CIK is not accepted, see Known limitations.

## Recipes

**Find a company by name, pinned to a city**

```ts
const { records, totalCount } = await client.search({
  search: "Apple",
  cityName: "CUPERTINO",
  pageSize: 5
});
```

**Build a segment: companies in a province with 50 or more employees**

```ts
const page = await client.search({
  provinceName: "SANTA CLARA",
  employeesTotal: { min: 50 },
  hasPhone: true,
  pageSize: 100
});
```

**Stream a whole segment with scroll export**

```ts
for await (const company of client.iterate(
  { cityName: "NEW YORK", hasEmail: true },
  { maxRecords: 5000 }
)) {
  console.log(company["Company Name"], company["Email"]);
}
```

**Drive the scroll loop yourself**

```ts
let batch = await client.exportWithScroll({ cityName: "NEW YORK", hasEmail: true, pageSize: 50 });
while (batch.records.length > 0) {
  process(batch.records);
  if (!batch.hasMoreRecords || !batch.scrollId) break;
  batch = await client.exportWithScroll({ cityName: "NEW YORK", hasEmail: true, scrollId: batch.scrollId, pageSize: 50 });
}
```

**Anything else: drop to the master client**

```ts
const res = await client.raw.company.search({ countryCode: "DE", cityName: "BERLIN", pageSize: 10 });
```

### Common filters

| Filter | Example | Notes |
| --- | --- | --- |
| `search` | `"Apple"` | Free text over company and trade names. |
| `nationalId` | `"0806592"` | Registration number. The lookup helper sets this for you. |
| `cityName` | `"NEW YORK"` | UPPER CASE. |
| `provinceName` | `"SANTA CLARA"` | Admin-2 name, UPPER CASE (the record's `State/Province`). |
| `postalCode` | `"95014-0642"` | Exact match. |
| `hasEmail`, `hasPhone`, `hasWebsite` | `true` | Contact availability. |
| `employeesTotal`, `annualSales`, `foundingYears` | `{ min: 50, max: 500 }` | Range filters. |
| `sic4Digits` | `"7372"` | 4-digit SIC industry code. |

Full list: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

## Known limitations

- The registration number is a **state** filing number, not the SEC CIK. `getByRegistrationNumber("320193")` (Apple's CIK) returns `null`. Look public companies up by name with `search` and narrow with `regionName`.
- State filing numbers repeat across states. Without `regionName` you may get a different company with the same number in another state.
- `regionName` is the state in Title Case (`"California"`). `provinceName` is the county, in upper case (`"SANTA CLARA"`).

## Four ways to integrate

Pick whichever fits how you build. All four hit the same data behind the same key.

1. **This register SDK** (`@companydata/sec-edgar-api`): US lookups with a state-filing-number helper. You are here.
2. **Master SDK** ([`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk)): all 200+ countries in one typed client, keyed by `countryCode`.
3. **MCP server**: connect an AI agent (Claude, Cursor and others) to `https://companydata.com/mcp/` with your key in the `x-api-key` header. See [companydata-mcp-server](https://github.com/companydatacom/companydata-mcp-server).
4. **Raw REST**: call `GET https://app.companydata.com/api/company/search?countryCode=US&cityName=NEW%20YORK` with an `x-api-key` header. Contract: [companydata.com/openapi.json](https://companydata.com/openapi.json).

```bash
curl -H "x-api-key: $COMPANYDATA_API_KEY" \
  "https://app.companydata.com/api/company/search?countryCode=US&nationalId=0806592&pageSize=1"
```

## Error handling

Failed requests throw `ApiError` with the HTTP status. The client retries transient failures (429 and 5xx) with backoff before giving up.

```ts
import { ApiError } from "@companydata/sec-edgar-api";

try {
  await client.search({ cityName: "NEW YORK" });
} catch (err) {
  if (err instanceof ApiError) {
    // 401: bad or missing key, 429: rate limited,
    // "Export credit limit exceeded" (code credits_limit_exceeded): export credits used up
    console.error(err.status, err.message);
  }
}
```

A scroll batch that is larger than your remaining credits is rejected as a whole, so keep `pageSize` small when a key is close to its limit.

## All register wrappers

Same pattern, one per official register. Every wrapper returns the same record shape.

| Country | Register | Package | Lookup helper |
| --- | --- | --- | --- |
| 🇳🇱 Netherlands | KVK | [`@companydata/kvk-api`](https://github.com/companydatacom/kvk-api) | `getByKvkNumber` |
| 🇩🇪 Germany | Handelsregister | [`@companydata/handelsregister-api`](https://github.com/companydatacom/handelsregister-api) | `getByRegistrationNumber` |
| 🇬🇧 United Kingdom | Companies House | [`@companydata/companies-house-api`](https://github.com/companydatacom/companies-house-api) | `getByCompanyNumber` |
| 🇫🇷 France | Sirene | [`@companydata/sirene-api`](https://github.com/companydatacom/sirene-api) | `getBySiret` |
| 🇧🇪 Belgium | KBO/BCE | [`@companydata/kbo-api`](https://github.com/companydatacom/kbo-api) | `getByEnterpriseNumber` |
| 🇵🇱 Poland | KRS | [`@companydata/krs-api`](https://github.com/companydatacom/krs-api) | `getByNip` |
| 🇸🇪 Sweden | Bolagsverket | [`@companydata/bolagsverket-api`](https://github.com/companydatacom/bolagsverket-api) | `getByOrgNumber` |
| 🇨🇭 Switzerland | Zefix | [`@companydata/zefix-api`](https://github.com/companydatacom/zefix-api) | `getByUid` |
| 🇨🇿 Czech Republic | ARES | [`@companydata/ares-api`](https://github.com/companydatacom/ares-api) | `getByIco` |
| 🇩🇰 Denmark | CVR | [`@companydata/cvr-api`](https://github.com/companydatacom/cvr-api) | `getByCvr` |
| 🇧🇷 Brazil | CNPJ | [`@companydata/cnpj-api`](https://github.com/companydatacom/cnpj-api) | `getByCnpj` |
| 🇦🇺 Australia | ABR | [`@companydata/abn-lookup-api`](https://github.com/companydatacom/abn-lookup-api) | `getByAbn` |
| 🇺🇸 United States | SEC EDGAR | [`@companydata/sec-edgar-api`](https://github.com/companydatacom/sec-edgar-api) | `getByRegistrationNumber` |

Plus the master SDK for every other country: [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk).

## License

MIT. Built and maintained by [CompanyData.com](https://companydata.com).

/**
 * @companydata/sec-edgar-api
 *
 * A thin, typed convenience wrapper around the CompanyData API for US SEC EDGAR.
 * It is not a separate API: it is the same `@companydata/companydata-sdk`
 * client with the country pinned to US and a register-specific helper on
 * top, so you can write `client.getByCik("...")` instead of assembling
 * query parameters by hand.
 *
 * One schema, one key across every CompanyData register.
 */
import {
  ApiClient,
  type ApiClientConfig,
  type CompanyExportParams,
  type CompanyExportScrollResponse,
  type CompanyExportStandardResponse,
  type CompanySearchParams,
  type CompanySearchResponse,
  type RequestOptions
} from "@companydata/companydata-sdk";

export const COUNTRY_CODE = "US" as const;

export type SecEdgarSearchParams = Omit<CompanySearchParams, "countryCode">;
export type SecEdgarExportParams = Omit<CompanyExportParams, "countryCode">;
export interface SecEdgarClientConfig extends ApiClientConfig {}

/** Client for US SEC EDGAR data. */
export class SecEdgarClient {
  private readonly api: ApiClient;

  constructor(config: SecEdgarClientConfig) {
    this.api = new ApiClient(config);
  }

  /** Search businesses. `countryCode` is fixed to "US". */
  search(params: SecEdgarSearchParams = {}, options?: RequestOptions): Promise<CompanySearchResponse> {
    return this.api.company.search({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /** Look up one business by its CIK. Returns the first match, or null. */
  async getByCik(id: string, options?: RequestOptions): Promise<Record<string, unknown> | null> {
    const clean = id.replace(/\s+/g, "");
    const response = await this.api.company.search(
      { nationalId: clean, countryCode: COUNTRY_CODE, pageSize: 1 },
      options
    );
    const records = Array.isArray(response.data) ? response.data : (response.data?.records ?? []);
    return records[0] ?? null;
  }

  /** Export a page of results (standard pagination). */
  export(params: SecEdgarExportParams = {}, options?: RequestOptions): Promise<CompanyExportStandardResponse> {
    return this.api.company.export({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /** Export large sets page by page in scroll mode. */
  exportWithScroll(params: Omit<SecEdgarExportParams, "useScroll"> = {}, options?: RequestOptions): Promise<CompanyExportScrollResponse> {
    return this.api.company.exportWithScroll({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /** Escape hatch: the underlying master SDK client. */
  get raw(): ApiClient {
    return this.api;
  }
}

export function createSecEdgarClient(config: SecEdgarClientConfig): SecEdgarClient {
  return new SecEdgarClient(config);
}

export { ApiError } from "@companydata/companydata-sdk";
export type {
  ApiClientConfig,
  CompanyExportScrollResponse,
  CompanyExportStandardResponse,
  CompanyRecord,
  CompanySearchResponse,
  RequestOptions
} from "@companydata/companydata-sdk";

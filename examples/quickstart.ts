/** Run: COMPANYDATA_API_KEY=... npx tsx examples/quickstart.ts */
import { SecEdgarClient } from "../src/index";

const client = new SecEdgarClient({ auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! } });

const company = await client.getByCik("0000320193");
console.log("By CIK:", company);

const page = await client.search({ cityName: "New York", hasEmail: true, pageSize: 25 });
console.log("Search:", page.data);

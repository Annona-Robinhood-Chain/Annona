import { robinhoodMainnet } from "./chains";

// Tautan alamat di block explorer mainnet. Dipisah dari halaman Docs supaya teks halaman tidak memuat nama chain/penerbit
// (pagar `lib/legal/guardrails.test.ts`). Tampilan saja; tidak mengubah konfigurasi chain.
export const explorerAddressUrl = (address: string) => `${robinhoodMainnet.blockExplorers.default.url}/address/${address}`;

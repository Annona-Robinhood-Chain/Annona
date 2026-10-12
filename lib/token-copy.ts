// Deskripsi satu kalimat per token (poin 4 update copy). Satu tempat supaya mudah diganti; tanpa JSX supaya bisa dites dan dipindai pagar copy.
// Kunci = simbol token. Teks ini hanya tampilan: tidak menyentuh kontrak, database, atau perhitungan.
export const TOKEN_COPY: Record<string, string> = {
  cMAG7: "One token, seven top US stocks. Equal weight, rebalanced on schedule.",
  cCHIP: "One token, the top chip stocks. Equal weight, rebalanced on schedule.",
  cVOLT: "One token, a basket of energy and power stocks. Equal weight, rebalanced on schedule.",
  sNVDA: "Deposit NVDA, earn weekly yield. You give up gains above the strike.",
  gNVDA: "Deposit USDG, earn weekly yield while you wait to buy NVDA lower. You can lose more than the yield.",
};

/** Deskripsi token, atau undefined bila simbolnya belum punya teks (pemanggil jatuh ke teks lama). */
export const tokenCopy = (symbol: string): string | undefined => TOKEN_COPY[symbol];

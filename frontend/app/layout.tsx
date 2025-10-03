import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <title>GreenProof - 链上环保行为记录</title>
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

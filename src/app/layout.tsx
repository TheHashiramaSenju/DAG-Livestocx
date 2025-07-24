import "./globals.css";
import Web3ProviderWrapper from "./Web3ProviderWrapper";
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3ProviderWrapper>
          {children}
        </Web3ProviderWrapper>
      </body>
    </html>
  );
}

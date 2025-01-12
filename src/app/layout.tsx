// app/layout.tsx
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={cn(
        inter.className,
        "min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white antialiased"
      )}>
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
            <h1 className="text-4xl font-bold mb-2">BeReal, Wrapped</h1>
            <p className="text-lg mb-8 text-gray-400">Generate your BeReal year in review</p>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '생애최초 주택구매 계산기',
  description:
    '첫 집을 구매하는 데 필요한 모든 것을 계산해드립니다. 소득, 자산, 부대비용을 입력하면 구매 가능 가격대, 최대 대출액, 월 상환액, 취득세, 정부 대출 상품을 한 번에 확인할 수 있습니다.',
  keywords: [
    '주택구매',
    '계산기',
    '생애최초',
    '대출',
    '취득세',
    '주담대',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50">
        <div className="min-h-screen">
          <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-emerald-900 text-white py-8 shadow-lg">
            <div className="max-w-4xl mx-auto px-4">
              <h1 className="text-3xl font-bold mb-2">
                🏠 생애최초 주택구매 계산기
              </h1>
              <p className="text-blue-100">
                첫 집 구매에 필요한 모든 정보를 한 번에 확인하세요
              </p>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-12">
            {children}
          </main>

          <footer className="bg-gray-800 text-gray-300 py-8 mt-16">
            <div className="max-w-4xl mx-auto px-4 text-center text-sm">
              <p>
                이 계산기는 참고용입니다. 정확한 금액은 금융기관과 상담 후
                확인하세요.
              </p>
              <p className="mt-2 opacity-75">
                © 2024 생애최초 주택구매 계산기
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

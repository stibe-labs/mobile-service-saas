import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Mobile Service Shop — Management System',
  description: 'Simplified service management system for mobile phone repair business',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

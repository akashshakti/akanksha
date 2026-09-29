import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Akanksha Verma — Fine Arts Portfolio',
  description: 'Fine Arts portfolio and digital gallery of Akanksha Verma.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

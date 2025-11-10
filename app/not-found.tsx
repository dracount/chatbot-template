'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem' }}>404 - Page Not Found</h1>
      <p style={{ marginBottom: '2rem' }}>Sorry, the page you are looking for does not exist.</p>
      <Link href="/" style={{
        color: '#fff',
        backgroundColor: '#0070f3',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        textDecoration: 'none'
      }}>
        Return Home
      </Link>
    </div>
  );
}

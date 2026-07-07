'use client';

import type { Metadata } from 'next';
import React from 'react';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'PennyScan - Find Penny Deals Near You',
  description: 'Discover penny deals and deep clearance items at nearby stores with exact aisle locations',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-gray-50">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}

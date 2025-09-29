import { NextRequest, NextResponse } from 'next/server';

async function proxyRequest(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/supabase', '');
  const supabaseUrl = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}${path}${url.search}`);

  // Forward relevant headers
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key !== 'host' && key !== 'content-length' && key !== 'transfer-encoding') {
      headers.append(key, value);
    }
  });

  // Add anon key if no auth
  if (!headers.has('Authorization')) {
    headers.set('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }

  const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined;

  const response = await fetch(supabaseUrl.toString(), {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  });

  // Create Next.js response
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else if (contentType?.includes('text/')) {
    data = await response.text();
  } else {
    data = await response.blob();
  }

  const nextResponse = NextResponse.json(data, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });

  // Forward cookies for auth
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      // Parse and set cookie
      const cookie = parseCookie(value);
      nextResponse.cookies.set(cookie.name, cookie.value, {
        domain: request.cookies.get('__Host-next-router-state-tree')?.domain || '.localhost', // Adjust for domain
        path: cookie.path || '/',
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite || 'lax',
        maxAge: cookie.maxAge || 60 * 60 * 24 * 7, // 7 days default
      });
    }
  });

  return nextResponse;
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

interface CookieOptions {
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
  path?: string;
}

function parseCookie(cookieStr: string): { name: string; value: string; options?: CookieOptions } {
  const parts = cookieStr.split(';').map(part => part.trim());
  const [nameValue] = parts;
  const [name, value] = nameValue.split('=');
  // Parse other attributes
  const options: CookieOptions = {};
  for (const part of parts.slice(1)) {
    if (part.includes('Secure')) options.secure = true;
    if (part.includes('HttpOnly')) options.httpOnly = true;
    if (part.includes('SameSite')) {
      const match = part.match(/SameSite=(.+)/);
      options.sameSite = match ? match[1] : 'lax';
    }
    if (part.includes('Path')) {
      const match = part.match(/Path=(.+)/);
      options.path = match ? match[1] : '/';
    }
    // Max-Age etc.
  }
  return { name: name!, value, options };
}

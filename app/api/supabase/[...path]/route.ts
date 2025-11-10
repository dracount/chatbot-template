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

  // Create Next.js response based on content type
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else if (contentType?.includes('text/')) {
    data = await response.text();
  } else {
    data = await response.blob();
  }

  let nextResponse;
  if (contentType?.includes('application/json')) {
    nextResponse = NextResponse.json(data, { status: response.status });
  } else if (contentType?.includes('text/')) {
    nextResponse = new NextResponse(data, { status: response.status, headers: { 'Content-Type': contentType! } });
  } else {
    nextResponse = new NextResponse(data, { status: response.status });
  }

  // Forward headers, including Set-Cookie directly
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'set-cookie') {
      const setCookieValues = value;
      const cookies = Array.isArray(setCookieValues) ? setCookieValues : [setCookieValues];
      cookies.forEach(cookie => nextResponse.headers.append('set-cookie', cookie));
    } else if (!['content-length', 'content-encoding', 'transfer-encoding', 'connection', 'host'].includes(lowerKey)) {
      nextResponse.headers.set(key, value);
    }
  });

  // CORS headers for safety
  nextResponse.headers.set('Access-Control-Allow-Origin', '*');
  nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

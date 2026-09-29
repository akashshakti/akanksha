import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

export async function GET() {
  if (!SCRIPT_URL) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: 'GOOGLE_APPS_SCRIPT_URL is missing in .env.local'
      },
      { status: 500 }
    );
  }

  try {
    const separator = SCRIPT_URL.includes('?') ? '&' : '?';
    const url = `${SCRIPT_URL}${separator}v=${Date.now()}`;

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        Accept: 'application/json'
      }
    });

    const text = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          configured: true,
          error: 'Google Apps Script did not return valid JSON.',
          raw: text.slice(0, 500)
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          configured: true,
          error: `Google Apps Script returned HTTP ${response.status}`,
          data
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        configured: true,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to connect to Google Apps Script.'
      },
      { status: 500 }
    );
  }
}

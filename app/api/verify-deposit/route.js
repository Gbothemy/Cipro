import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Automatic blockchain verification is not configured. Deposits require manual administrator review.' },
    { status: 501 }
  );
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Указываем, для каких путей применять middleware
export const config = {
  matcher: []
}; 
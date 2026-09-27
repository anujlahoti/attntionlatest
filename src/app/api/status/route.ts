import { databaseStatus, integrationStatus } from '@/lib/integrations'
import { NextResponse } from 'next/server'

// Only reports whether each integration is configured, never the keys themselves.
export async function GET() {
  return NextResponse.json({ integrations: [await databaseStatus(), ...integrationStatus()] })
}

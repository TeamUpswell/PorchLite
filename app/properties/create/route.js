import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "This route is handled at runtime" });
}

export const dynamic = "force-dynamic";

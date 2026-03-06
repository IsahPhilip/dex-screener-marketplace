import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

function generateOrderId() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${timestamp}${random}`;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    chain,
    tokenAddress,
    tokenName,
    tokenSymbol,
    description,
    paymentMethod,
    acceptVerifiableData,
    acceptPolicy,
  } = body ?? {};

  if (
    !chain ||
    !tokenAddress ||
    !tokenName ||
    !tokenSymbol ||
    !description ||
    !paymentMethod ||
    !acceptVerifiableData ||
    !acceptPolicy
  ) {
    return NextResponse.json(
      { error: "Missing required order fields" },
      { status: 400 },
    );
  }

  return NextResponse.json({ orderId: generateOrderId() }, { status: 201 });
}

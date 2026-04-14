import { NextResponse } from "next/server";
import { findUserByEmail } from "../users";

type LoginRequest = {
  email?: string;
  password?: string;
  role?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequest;
  const { email, password, role } = body;

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  const user = findUserByEmail(email);

  if (!user) {
    return NextResponse.json(
      { message: "Account not found" },
      { status: 404 }
    );
  }

  if (role && user.role !== role) {
    return NextResponse.json(
      { message: "Selected role does not match this account. Please choose the correct role." },
      { status: 403 }
    );
  }

  if (user.password !== password) {
    return NextResponse.json(
      { message: "Incorrect password" },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
    { status: 200 }
  );
}

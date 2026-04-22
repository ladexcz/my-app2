import { NextResponse } from "next/server";

type RegisterRequest = {
  name?: string;
  fullName?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  role?: string;
  phone?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterRequest;
  const name = body.name?.trim() || body.fullName?.trim();
  const { email, password, password_confirmation, role, phone } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { message: "All fields are required." },
      { status: 400 }
    );
  }

  if (!password_confirmation || password !== password_confirmation) {
    return NextResponse.json(
      { message: "Passwords do not match." },
      { status: 400 }
    );
  }

  if (!['buyer', 'producer', 'rider'].includes(role)) {
    return NextResponse.json(
      { message: "Invalid role." },
      { status: 400 }
    );
  }

  try {
    // Call Laravel backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          email: email.toLowerCase().trim(),
          password,
          password_confirmation,
          role,
          phone: phone || null,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Server error: Could not connect to backend" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { addUser, findUserByEmail } from "../users";

type RegisterRequest = {
  name?: string;
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterRequest;
  const name = body.name?.trim() || body.fullName?.trim();
  const { email, password, role } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { message: "All fields are required." },
      { status: 400 }
    );
  }

  if (findUserByEmail(email)) {
    return NextResponse.json(
      { message: "Account already exists." },
      { status: 409 }
    );
  }

  addUser({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: role as "buyer" | "producer" | "rider" | "admin",
  });

  return NextResponse.json({ success: true, user: { name, role } }, { status: 200 });
}

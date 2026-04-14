export type AuthUser = {
  name: string;
  email: string;
  password: string;
  role: "buyer" | "producer" | "rider" | "admin";
};

const users: AuthUser[] = [
  {
    name: "Demo Customer",
    email: "test@example.com",
    password: "password123",
    role: "buyer",
  },
  {
    name: "Demo Seller",
    email: "seller@example.com",
    password: "password123",
    role: "producer",
  },
  {
    name: "Demo Delivery Partner",
    email: "delivery@example.com",
    password: "password123",
    role: "rider",
  },
  {
    name: "🧑‍💼 Admin",
    email: "admin@gmail.com",
    password: "123456",
    role: "admin",
  },
];

export function findUserByEmail(email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase().trim());
}

export function addUser(user: AuthUser) {
  users.push(user);
  return user;
}

export function userExists(email: string) {
  return users.some((user) => user.email.toLowerCase() === email.toLowerCase().trim());
}

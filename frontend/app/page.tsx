import Link from "next/link";

const features = [
  "Fast mobile-first marketplace flow",
  "Role-based dashboards for 🛒 Customer, 👨‍🌾 Seller, 🚚 Delivery Partner, 🧑‍💼 Admin",
  "Simple registration and login with mock auth",
  "Clean cards, rounded surfaces, and polished spacing",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#EEF3E4] text-[#1B1B1B]">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-12">
        <div className="rounded-[2rem] border border-[#D8D3BC] bg-[#F6F3E7] p-8 shadow-[0_24px_70px_rgba(46,125,50,0.08)]">
          <div className="space-y-6 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-[#2E7D32]">Agri Marketplace</p>
            <h1 className="text-4xl font-semibold tracking-tight text-[#1B1B1B] sm:text-5xl">
              Mobile-first agricultural marketplace for the Philippines
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-[#4F4F4F] sm:text-lg">
              Role-based dashboards for 🛒 Customers, 👨‍🌾 Sellers, 🚚 Delivery Partners, and 🧑‍💼 Admins with a clean Tailwind UI and mock authentication flow.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/login"
              className="rounded-3xl bg-[#2E7D32] px-5 py-4 text-center text-base font-semibold text-white transition duration-300 hover:bg-[#256229]"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-3xl border border-[#D8D3BC] bg-[#A3C593] px-5 py-4 text-center text-base font-semibold text-[#1B1B1B] transition duration-300 hover:bg-[#8CB67B]"
            >
              Register
            </Link>
          </div>

          <div className="mt-10 grid gap-3">
            {features.map((feature) => (
              <div key={feature} className="rounded-3xl border border-[#D8D3BC] bg-[#F3F1E5] px-5 py-4 text-sm text-[#4F4F4F] shadow-sm">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}


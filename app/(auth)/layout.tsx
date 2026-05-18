import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GruuvyPay Admin",
  description: "GruuvyPay Admin Panel",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{ backgroundColor: "#0F0F0F" }}
    >
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dbd861]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-black"
              aria-hidden="true"
            >
              <path
                d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                fill="currentColor"
                opacity="0.2"
              />
              <path
                d="M8 12h8M12 8l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            GruuvyPay
          </span>
        </div>
        <span className="text-xs font-medium tracking-widest text-[#dbd861] uppercase">
          Admin Panel
        </span>
      </div>

      <div className="w-full max-w-sm px-4">{children}</div>
    </div>
  );
}

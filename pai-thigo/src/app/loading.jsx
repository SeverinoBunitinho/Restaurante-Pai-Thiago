export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="shell pt-4">
        <div className="nav-pill rounded-[2rem] px-4 py-4">
          <div className="h-14 animate-pulse rounded-[1.4rem] bg-[rgba(255,255,255,0.44)]" />
        </div>
      </div>

      <main className="shell pt-8 pb-16">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
          <div className="luxury-card-dark rounded-[2.6rem] p-8">
            <div className="h-4 w-40 animate-pulse rounded-full bg-[rgba(255,255,255,0.16)]" />
            <div className="mt-6 h-24 animate-pulse rounded-[1.8rem] bg-[rgba(255,255,255,0.1)]" />
            <div className="mt-5 h-20 animate-pulse rounded-[1.8rem] bg-[rgba(255,255,255,0.08)]" />
          </div>

          <div className="luxury-card rounded-[2.6rem] p-8">
            <div className="h-4 w-32 animate-pulse rounded-full bg-[rgba(20,35,29,0.08)]" />
            <div className="mt-6 h-16 animate-pulse rounded-[1.6rem] bg-[rgba(20,35,29,0.06)]" />
            <div className="mt-4 h-16 animate-pulse rounded-[1.6rem] bg-[rgba(20,35,29,0.06)]" />
            <div className="mt-4 h-12 animate-pulse rounded-full bg-[rgba(20,35,29,0.08)]" />
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="luxury-card rounded-[2rem] p-6">
              <div className="h-4 w-28 animate-pulse rounded-full bg-[rgba(20,35,29,0.08)]" />
              <div className="mt-5 h-10 animate-pulse rounded-[1.2rem] bg-[rgba(20,35,29,0.06)]" />
              <div className="mt-4 h-16 animate-pulse rounded-[1.2rem] bg-[rgba(20,35,29,0.05)]" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

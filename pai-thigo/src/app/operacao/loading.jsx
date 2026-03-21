export default function OperacaoLoading() {
  return (
    <main className="space-y-6 pb-10 pt-10">
      <section className="grid gap-4 rounded-[2.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.46)] px-5 py-5 shadow-[0_20px_60px_rgba(36,29,15,0.06)] sm:grid-cols-3 lg:px-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-[1.5rem] px-4 py-4">
            <div className="loading-bar h-3 w-24" />
            <div className="loading-bar mt-4 h-10 w-20" />
            <div className="loading-bar mt-4 h-4 w-full" />
          </div>
        ))}
      </section>

      <section className="loading-glass rounded-[2.2rem] p-6">
        <div className="loading-bar h-4 w-32" />
        <div className="loading-bar mt-5 h-12 w-2/3" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
            >
              <div className="loading-bar h-5 w-40" />
              <div className="loading-bar mt-3 h-4 w-full" />
              <div className="loading-bar mt-2 h-4 w-4/5" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

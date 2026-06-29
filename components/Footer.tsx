export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-12">
      <div className="mx-auto max-w-[1600px] w-full px-6 md:px-12 lg:px-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-black tracking-[0.3em] text-white uppercase">NENEZ</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
            live shows and access info
          </p>
          <p className="text-[10px] text-zinc-600 mt-4">
            &copy; {new Date().getFullYear()} NENEZ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

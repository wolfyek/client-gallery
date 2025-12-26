import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#121212] text-white">
            <div className="text-center">
                <h1 className="text-6xl font-bold mb-4 tracking-tighter">404</h1>
                <p className="uppercase tracking-widest text-white/50 mb-8">Stran ne obstaja</p>
                <Link href="/" className="bg-white text-black px-6 py-3 uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors">
                    Nazaj na domačo stran
                </Link>
            </div>
        </div>
    );
}

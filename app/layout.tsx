import type { Metadata } from "next";
import { Big_Shoulders_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const bigShoulders = Big_Shoulders_Display({
    subsets: ["latin"],
    variable: "--font-big-shoulders",
});

const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-dm-sans",
});

export const metadata: Metadata = {
    title: "Galerija - Farkaš Timi",
    description: "Private client photography gallery",
    icons: {
        icon: "http://streznik.farkastimi.si/Farkas-LOGO.svg",
        shortcut: "http://streznik.farkastimi.si/Farkas-LOGO.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${bigShoulders.variable} ${dmSans.variable} font-sans antialiased min-h-screen flex flex-col`}>
                {children}

                <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
                    <div className="w-full h-[1px] bg-white/10" />
                </div>

                <footer className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-16 flex flex-col md:flex-row justify-between items-center gap-8 text-[13px] text-white/40 font-dm font-normal uppercase tracking-widest">
                    <p>Vse pravice pridržane, Farkaš Timi Photography 2025 ©</p>

                    <img
                        src="/signature.png"
                        alt="Farkaš Timi Photography"
                        className="h-20 w-auto opacity-80 hover:opacity-100 transition-opacity"
                    />

                    <p>Stran ustvaril z srcem, sam.</p>
                </footer>
            </body>
        </html>
    );
}

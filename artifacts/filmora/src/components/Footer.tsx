import React from 'react';
import Link from 'next/link';
import { siteConfig } from "@/lib/config";
import { shivCredits } from "@/lib/shivCredits";
import BrandLogo from "@/components/BrandLogo";
import { Heart } from "lucide-react";

function FooterCreditLink({ name, link }: { name: string; link?: string }) {
    if (!link) return <span className="text-foreground/80 font-semibold">{name}</span>;
    return (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent hover:text-accent/80 transition-colors duration-200 hover:underline underline-offset-4"
        >
            {name}
        </a>
    );
}

const Footer = () => {
    const dev = shivCredits.developer;
    const updates = shivCredits.updatesChannels[0];
    const support = shivCredits.supportGroups[0];

    return (
        <footer className="mt-16 border-t border-[var(--footer-border)] bg-background text-sm text-muted-foreground">

            {/* ── Main row ── */}
            <div className="container mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Left: Brand + nav */}
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                    <Link href="/" className="flex-shrink-0">
                        <BrandLogo iconClass="h-8 w-8" textClass="text-[18px]" />
                    </Link>
                    <nav className="flex flex-wrap justify-center gap-5 text-sm">
                        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                        <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
                        <Link href="/dmca" className="hover:text-foreground transition-colors">DMCA</Link>
                        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                        <Link href="/credits" className="hover:text-foreground transition-colors">Credits</Link>
                    </nav>
                </div>

                {/* Middle: Disclaimer */}
                <p className="text-sm text-muted-foreground max-w-sm hidden md:block text-center mx-auto leading-relaxed">
                    {siteConfig.name} does not host any content on our servers.
                </p>

                {/* Right: Copyright */}
                <div className="text-sm font-semibold text-foreground/70 flex-shrink-0">
                    &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
                </div>
            </div>

            {/* ── Credits bar ── */}
            <div className="border-t border-[var(--footer-border)]/60 py-4 px-6">
                <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-muted-foreground">

                    {/* Made with love */}
                    <span className="flex items-center gap-1.5 flex-wrap justify-center">
                        Made with{" "}
                        <Heart className="inline w-4 h-4 text-red-500 fill-current drop-shadow-[0_0_5px_rgba(239,68,68,0.55)]" />
                        {" "}by{" "}
                        <FooterCreditLink name={dev.name} link={dev.link} />
                        {shivCredits.assistantDeveloper && (
                            <>
                                <span className="font-bold text-muted-foreground mx-0.5">&amp;</span>
                                <FooterCreditLink name={shivCredits.assistantDeveloper.name} link={shivCredits.assistantDeveloper.link} />
                            </>
                        )}
                    </span>

                    <span className="hidden sm:block w-px h-4 bg-muted-foreground/30" />

                    {/* Updates + Support */}
                    <span className="flex items-center gap-4">
                        {updates && (
                            <FooterCreditLink name="Updates" link={updates.link} />
                        )}
                        {support && (
                            <>
                                <span className="w-px h-4 bg-muted-foreground/30" />
                                <FooterCreditLink name="Support" link={support.link} />
                            </>
                        )}
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

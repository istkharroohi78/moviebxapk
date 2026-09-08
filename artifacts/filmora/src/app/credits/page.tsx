import React from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { shivCredits, CreditPerson, CreditChannel } from "@/lib/shivCredits";
import { Heart, Code2, Users, Radio, Headphones, ExternalLink } from "lucide-react";
export const metadata: Metadata = {
  title: `Credits | ${siteConfig.name}`,
  description: `Meet the people and communities behind ${siteConfig.name}.`,
};

function CreditLink({ item }: { item: CreditPerson | CreditChannel }) {
  if (!item.link) return <span className="text-foreground font-bold">{item.name}</span>;
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-bold text-accent hover:underline underline-offset-4 transition-colors duration-200 group"
    >
      {item.name}
      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </a>
  );
}

interface SectionCardProps {
  label: string;
  name: string;
  link?: string;
  icon: React.ReactNode;
  index?: number;
}

function CreditCard({ label, name, link, icon, index = 0 }: SectionCardProps) {
  const item = { label, name, link };
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-[var(--card-panel-border)] bg-[var(--prime-card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[0_0_24px_var(--accent-glow)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-glow)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="relative z-10 flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-accent transition-all duration-300 group-hover:bg-[var(--accent)]/20">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--card-panel-muted)] mb-1">
            {label}
          </p>
          <div className="text-base">
            <CreditLink item={item} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, subtitle, icon, children }: SectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-accent flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--card-panel-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

export default function CreditsPage() {
  return (
    <main className="min-h-screen bg-[var(--prime-dark)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-16">

        {/* Hero */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/8 text-accent text-[11px] font-black uppercase tracking-widest mb-2">
            <Heart className="w-3.5 h-3.5 fill-current" />
            Built with love
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            {siteConfig.name}{" "}
            <span className="text-accent">Credits</span>
          </h1>
          <p className="text-[var(--card-panel-muted)] text-lg max-w-xl mx-auto leading-relaxed">
            People and communities behind {siteConfig.name}.
          </p>
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--accent)]/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--accent)]/50" />
          </div>
        </div>

        {/* Core Team */}
        <Section title="Core Team" subtitle="The people who built this platform" icon={<Code2 className="w-4 h-4" />}>
          <CreditCard
            label={shivCredits.developer.label}
            name={shivCredits.developer.name}
            link={shivCredits.developer.link}
            icon={<Code2 className="w-5 h-5" />}
            index={0}
          />
          <CreditCard
            label={shivCredits.assistantDeveloper.label}
            name={shivCredits.assistantDeveloper.name}
            link={shivCredits.assistantDeveloper.link}
            icon={<Users className="w-5 h-5" />}
            index={1}
          />
        </Section>

        {/* Updates Channels */}
        <Section title="Official Updates" subtitle="Stay up to date with the latest news" icon={<Radio className="w-4 h-4" />}>
          {shivCredits.updatesChannels.map((ch, i) => (
            <CreditCard
              key={ch.label}
              label={ch.label}
              name={ch.name}
              link={ch.link}
              icon={<Radio className="w-5 h-5" />}
              index={i}
            />
          ))}
        </Section>

        {/* Support Groups */}
        <Section title="Support Communities" subtitle="Get help and connect with others" icon={<Headphones className="w-4 h-4" />}>
          {shivCredits.supportGroups.map((sg, i) => (
            <CreditCard
              key={sg.label}
              label={sg.label}
              name={sg.name}
              link={sg.link}
              icon={<Headphones className="w-5 h-5" />}
              index={i}
            />
          ))}
        </Section>

        {/* Bottom badge */}
        <div className="text-center pt-4">
          <p className="text-[var(--card-panel-muted)] text-sm">
            Made with{" "}
            <Heart className="inline w-4 h-4 text-red-500 fill-current mx-0.5 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]" />{" "}
            by{" "}
            {shivCredits.developer.link ? (
              <a
                href={shivCredits.developer.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent font-bold hover:underline underline-offset-4"
              >
                {shivCredits.developer.name}
              </a>
            ) : (
              <span className="text-accent font-bold">{shivCredits.developer.name}</span>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}

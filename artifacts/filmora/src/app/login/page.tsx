import LoginForm from "@/components/LoginForm";
import { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
    title: `Sign in with Gmail | ${siteConfig.name}`,
    description: `Sign in to ${siteConfig.name} with your Gmail address and a one-time code to sync your watchlist and downloads.`,
    alternates: { canonical: `${siteConfig.url}/login` },
};

export default function LoginPage() {
    return <LoginForm />;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, readSessionToken } from "@/lib/authServer";
import { getUser } from "@/lib/users";
import { siteConfig } from "@/lib/config";
import AccountCard from "@/components/AccountCard";

export const dynamic = "force-dynamic";

export const metadata = {
    title: `My Account | ${siteConfig.name}`,
    description: `Manage your ${siteConfig.name} account, signed in with Gmail.`,
};

export default async function AccountPage() {
    const store = await cookies();
    const session = readSessionToken(store.get(SESSION_COOKIE)?.value);
    if (!session) redirect("/login");

    const user = await getUser(session.email);

    return (
        <AccountCard
            email={session.email}
            name={user?.name ?? session.name}
            memberSince={user?.createdAt ?? null}
            loginCount={user?.loginCount ?? 1}
        />
    );
}

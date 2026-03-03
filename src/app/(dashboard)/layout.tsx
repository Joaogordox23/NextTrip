import { Header } from "@/components/layouts/header";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
            <Header />
            <main className="flex-1 w-full flex flex-col">
                {children}
            </main>
        </div>
    );
}

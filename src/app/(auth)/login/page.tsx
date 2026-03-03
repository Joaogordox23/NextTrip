"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { Map } from "lucide-react";

const loginSchema = z.object({
    email: z.string().email({ message: "Insira um e-mail válido." }),
    password: z.string().min(1, { message: "A senha é obrigatória." }),
});

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { setUser } = useAuthStore();

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Ocorreu um erro ao fazer login.");
            }

            setUser(data.user);
            toast.success("Login realizado com sucesso!");

            router.push(data.user.role === "ADMIN" ? "/admin/trips" : "/client/my-trips");
            router.refresh();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background">
            {/* Left Panel: Form */}
            <div className="flex w-full flex-col justify-center px-8 sm:px-12 lg:w-1/2 xl:w-5/12 2xl:w-1/3 relative z-10 bg-background/80 backdrop-blur-xl border-r">
                <div className="mx-auto w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
                        <div className="flex items-center gap-2.5 mb-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                <Map className="h-6 w-6" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">
                                Next<span className="text-primary italic">Trip</span>
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Bem-vindo(a) de volta</h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            Acesse sua conta para conferir seus roteiros ou gerenciar a agência.
                        </p>
                    </div>

                    <div className="bg-card/50 border shadow-sm rounded-2xl p-6 backdrop-blur-sm">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-700 dark:text-zinc-300">E-mail</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="h-11 rounded-lg bg-background/50 focus-visible:ring-primary/50"
                                                    placeholder="seu@email.com"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-zinc-700 dark:text-zinc-300">Senha</FormLabel>
                                                <Link href="#" className="text-xs font-semibold text-primary hover:underline" tabIndex={-1}>
                                                    Esqueceu a senha?
                                                </Link>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    className="h-11 rounded-lg bg-background/50 focus-visible:ring-primary/50"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full h-11 rounded-lg font-semibold shadow-md transition-all hover:-translate-y-0.5" disabled={isLoading}>
                                    {isLoading ? "Entrando..." : "Acessar Plataforma"}
                                </Button>
                            </form>
                        </Form>
                    </div>

                    <p className="text-center text-sm text-muted-foreground font-medium">
                        Ainda não tem conta?{" "}
                        <Link href="/register" className="text-primary font-bold hover:underline transition-all">
                            Registre-se agora
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Panel: Image / Hero */}
            <div className="hidden lg:flex flex-1 relative bg-zinc-900 overflow-hidden isolate">
                <img
                    src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=2070"
                    alt="Travel Background"
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-60 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/90 via-primary/30 to-transparent mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/20 to-transparent" />

                <div className="relative z-20 flex flex-col justify-end p-12 lg:p-16 h-full absolute bottom-0 w-full text-white animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
                    <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase mb-4 w-fit border border-white/20">
                        O Roteiro Perfeito
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 max-w-2xl leading-tight text-white drop-shadow-lg">
                        Comece a planejar sonhos inesquecíveis hoje.
                    </h2>
                    <p className="text-lg text-zinc-300 max-w-xl font-medium drop-shadow-md">
                        A união perfeita entre uma agência dedicada e turistas ansiosos pelo próximo destino. Junte-se à revolução do turismo.
                    </p>
                </div>
            </div>
        </div>
    );
}

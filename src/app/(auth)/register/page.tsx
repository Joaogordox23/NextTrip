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

const registerSchema = z.object({
    name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
    email: z.string().email({ message: "Insira um e-mail válido." }),
    password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    role: z.enum(["CLIENT", "ADMIN"]),
});

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { setUser } = useAuthStore();

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role: "CLIENT",
        },
    });

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Ocorreu um erro ao criar conta.");
            }

            setUser(data.user);
            toast.success("Conta criada com sucesso!");

            if (data.user.role === "ADMIN") {
                router.push("/admin/trips");
            } else {
                router.push("/client/my-trips");
            }
            router.refresh();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen w-full flex-col lg:flex-row-reverse bg-background">
            {/* Right Panel: Form (Reversed position for Register UX variety) */}
            <div className="flex w-full flex-col justify-center px-8 sm:px-12 lg:w-1/2 xl:w-5/12 2xl:w-1/3 relative z-10 bg-background/80 backdrop-blur-xl border-l">
                <div className="mx-auto w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                <Map className="h-6 w-6" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">
                                Next<span className="text-primary italic">Trip</span>
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Crie sua Conta</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Comece agora. Insira seus dados abaixo para se registrar na plataforma.
                        </p>
                    </div>

                    <div className="bg-card/50 border shadow-sm rounded-2xl p-6 backdrop-blur-sm">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-700 dark:text-zinc-300">Nome Completo</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="h-10 rounded-lg bg-background/50 focus-visible:ring-primary/50"
                                                    placeholder="João da Silva"
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
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-700 dark:text-zinc-300">E-mail</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="h-10 rounded-lg bg-background/50 focus-visible:ring-primary/50"
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
                                            <FormLabel className="text-zinc-700 dark:text-zinc-300">Senha</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="h-10 rounded-lg bg-background/50 focus-visible:ring-primary/50"
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
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-700 dark:text-zinc-300">Tipo de Conta</FormLabel>
                                            <FormControl>
                                                <select
                                                    className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    {...field}
                                                    disabled={isLoading}
                                                >
                                                    <option value="CLIENT">Turista (Cliente Final)</option>
                                                    <option value="ADMIN">Agência de Viagens</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full h-11 rounded-lg font-semibold shadow-md transition-all mt-6 hover:-translate-y-0.5" disabled={isLoading}>
                                    {isLoading ? "Criando conta..." : "Registrar"}
                                </Button>
                            </form>
                        </Form>
                    </div>

                    <p className="text-center text-sm text-muted-foreground font-medium">
                        Já possui uma conta?{" "}
                        <Link href="/login" className="text-primary font-bold hover:underline transition-all">
                            Fazer login
                        </Link>
                    </p>
                </div>
            </div>

            {/* Left Panel: Image / Hero */}
            <div className="hidden lg:flex flex-1 relative bg-zinc-900 overflow-hidden isolate">
                <img
                    src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=2070"
                    alt="Travel Background"
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-70 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/20 to-transparent mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/40 to-transparent" />

                <div className="relative z-20 flex flex-col justify-end p-12 lg:p-16 h-full absolute bottom-0 w-full text-white animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
                    <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase mb-4 w-fit border border-white/20">
                        Sua Agência Digital
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 max-w-2xl leading-tight text-white drop-shadow-lg">
                        Descubra o Mundo. <br className="hidden lg:block" /> Deixe o planejamento conosco.
                    </h2>
                    <p className="text-lg text-zinc-200 max-w-xl font-medium drop-shadow-md">
                        Cadastre-se na NextTrip e tenha o poder de orquestrar cada segundo de uma viagem épica.
                    </p>
                </div>
            </div>
        </div>
    );
}

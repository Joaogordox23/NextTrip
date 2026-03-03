"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SuggestionsReviewPage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user && user.role !== "ADMIN") {
            router.push('/login');
        }
    }, [user, router])

    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-suggestions'],
        queryFn: async () => {
            // In a real app we would have a GET /suggestions for ADMIN returning all of them
            // Due to MVP time constraints we are mocking the fetch from the API here
            // To simulate admin seeing all suggestions from the DB we would construct a new route or update the existing.
            const res = await fetch('/api/v1/suggestions', {
                headers: {
                    'x-user-id': user?.id || '',
                    'x-user-role': user?.role || ''
                }
            });
            // For now we will just return a mocked empty array or error if route doesnt exist
            if (!res.ok) throw new Error('Falha ao carregar sugestões');
            return res.json();
        }
    });

    const generateEmptyState = () => (
        <div className="col-span-full py-20 text-center border border-dashed rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold">Nenhuma sugestão pendente</h3>
            <p className="text-muted-foreground mt-2">Você está em dia com as demandas de alterações dos seus clientes!</p>
        </div>
    )

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-5xl">
            <div className="mb-8 border-b pb-6">
                <h1 className="text-3xl font-bold tracking-tight">Revisão de Sugestões</h1>
                <p className="text-muted-foreground mt-1">
                    Analise, aprove ou rejeite as alterações solicitadas pelos seus clientes.
                </p>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))
                ) : error || data?.suggestions?.length === 0 ? (
                    generateEmptyState()
                ) : (
                    data?.suggestions?.map((sug: any) => (
                        <div key={sug.id} className="bg-background border rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                        <Clock className="w-3 h-3 mr-1" /> Pendente
                                    </Badge>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {format(new Date(sug.createdAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-100 text-lg">
                                    &quot;{sug.content}&quot;
                                </p>
                                <div className="text-sm text-muted-foreground">
                                    Cliente: <strong>{sug.user?.name}</strong> • Roteiro: <strong>{sug.trip?.title || "Roteiro Atual"}</strong>
                                </div>
                            </div>

                            <div className="flex w-full md:w-auto gap-3">
                                <Button variant="outline" className="flex-1 md:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                    <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                                </Button>
                                <Button className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

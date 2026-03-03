"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, CalendarDays, PlusCircle, MapIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo, use } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const CATEGORY_MAP: Record<string, string> = {
    RESTAURANT: "Restaurante",
    ATTRACTION: "Atração",
    HOTEL: "Hotel",
    TRANSPORT: "Transporte"
};

export default function ClientTripDetailsPage({ params }: { params: Promise<{ tripId: string }> }) {
    const { tripId } = use(params);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionContent, setSuggestionContent] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['client-trip', tripId],
        queryFn: async () => {
            const [tripRes, daysRes, suggRes] = await Promise.all([
                fetch(`/api/v1/trips`),
                fetch(`/api/v1/itinerary/days/${tripId}`),
                fetch(`/api/v1/suggestions?tripId=${tripId}`)
            ])

            if (!tripRes.ok || !daysRes.ok || !suggRes.ok) throw new Error('Falha ao carregar detalhes do roteiro');

            const tripData = await tripRes.json();
            const daysData = await daysRes.json();
            const suggData = await suggRes.json();

            const trip = tripData.trips.find((t: any) => t.id === tripId);

            return { trip, days: daysData.days, suggestions: suggData.suggestions || [] };
        }
    });

    const createSuggestionMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await fetch('/api/v1/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit suggestion');
            return data;
        },
        onSuccess: () => {
            toast.success("Sugestão enviada para a agência avaliar.");
            setSuggestionContent("");
            setIsDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['client-trip', tripId] });
        },
        onError: (error: any) => toast.error(error.message)
    });

    const handleSuggest = (e: React.FormEvent) => {
        e.preventDefault();
        createSuggestionMutation.mutate({
            tripId,
            content: suggestionContent,
            type: "ALTERATION"
        });
    }

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-6xl space-y-8">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-40 w-full rounded-2xl" />
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        )
    }

    if (error || !data?.trip) {
        return (
            <div className="container mx-auto p-6 text-center mt-20">
                <h2 className="text-xl font-medium text-red-500">Erro ao carregar roteiro</h2>
                <Link href="/client/my-trips">
                    <Button variant="outline" className="mt-4">Voltar para Início</Button>
                </Link>
            </div>
        )
    }

    const safeDate = (dateString: string) => {
        if (!dateString) return new Date();
        const base = dateString.split("T")[0];
        // Cria a data forcando o meio dia local pra evitar shift de timezone
        return new Date(`${base}T12:00:00`);
    }

    const { trip, days, suggestions } = data;

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-7xl pb-32">
            {/* Header Controls */}
            <div className="flex justify-between items-center mb-6">
                <Link href="/client/my-trips">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:bg-zinc-100">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </Button>
                </Link>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2 rounded-xl shadow-sm bg-primary/90 hover:bg-primary">
                            <PlusCircle className="w-4 h-4" /> Sugerir Alteração
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova Sugestão</DialogTitle>
                            <DialogDescription>A agência irá avaliar sua sugestão antes de aplicá-la ao roteiro.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSuggest} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">O que você gostaria de mudar?</label>
                                <textarea
                                    required
                                    value={suggestionContent}
                                    onChange={(e) => setSuggestionContent(e.target.value)}
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Ex: Gostaria de trocar o restaurante do Dia 2 por uma opção de frutos do mar."
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={createSuggestionMutation.isPending}>
                                {createSuggestionMutation.isPending ? "Enviando..." : "Enviar Sugestão"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Hero Info */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-zinc-50 border rounded-2xl p-6 md:p-10 mb-8 relative overflow-hidden shadow-xl">
                {trip.coverImage ? (
                    <div className="absolute inset-0 z-0 opacity-30">
                        <img src={trip.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-transparent" />
                    </div>
                ) : (
                    <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none z-0" />
                )}

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <Badge className="mb-4 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 pointer-events-none border-zinc-700">Seu Próximo Destino</Badge>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{trip.title}</h1>
                        <p className="flex items-center gap-2 text-zinc-300 mt-3 text-lg">
                            <MapPin className="w-5 h-5 text-primary" /> {trip.destination}
                        </p>
                        {trip.description && <p className="mt-4 text-zinc-300 max-w-2xl text-sm md:text-base leading-relaxed">{trip.description}</p>}
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-10 relative z-10">
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 backdrop-blur-sm rounded-lg border border-zinc-700/50 text-sm font-medium">
                        <CalendarDays className="w-4 h-4 text-zinc-400" />
                        {safeDate(trip.startDate).toLocaleDateString()} ao {safeDate(trip.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 backdrop-blur-sm rounded-lg border border-zinc-700/50 text-sm font-medium">
                        <MapIcon className="w-4 h-4 text-zinc-400" />
                        {days.length} Dias de Aventura
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:gap-12 mt-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-8">Seu Cronograma Diário</h2>

                    {days.length === 0 ? (
                        <div className="p-12 text-center border border-dashed rounded-xl text-muted-foreground bg-zinc-50/50">
                            A agência ainda está montando o roteiro detalhado. Retorne em breve!
                        </div>
                    ) : (
                        days.map((day: { id: string; date: string; title: string; items: any[] }, i: number) => (
                            <div key={day.id} className="relative pl-6 pb-12 border-l-2 border-primary/20 last:border-0 last:pb-0">
                                <div className="absolute top-0 -left-2.5 w-5 h-5 bg-background rounded-full border-4 border-primary" />

                                <h3 className="font-bold text-xl leading-none pt-0.5 mb-2 text-zinc-900 dark:text-zinc-100">
                                    Dia {i + 1} - {safeDate(day.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                                </h3>
                                {day.title && <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-6 text-sm">{day.title}</p>}

                                <div className="space-y-4">
                                    {day.items.length === 0 ? (
                                        <div className="text-sm text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg italic">
                                            Horário livre ou a definir pela agência.
                                        </div>
                                    ) : (
                                        day.items.map((item: { id: string; title: string; category?: string; startTime: string; endTime: string; locationName: string; imageUrl?: string; description?: string, cost?: number }) => (
                                            <div key={item.id} className="bg-background border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
                                                    <div>
                                                        <span className="inline-block px-2 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded mb-2">
                                                            {CATEGORY_MAP[item.category || "ATTRACTION"] || "Atração"}
                                                        </span>
                                                        <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{item.title}</h4>
                                                    </div>
                                                    <span className="text-sm font-mono bg-primary/10 text-primary px-3 py-1.5 rounded-lg shrink-0">
                                                        {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                        {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3 font-medium">
                                                    <MapPin className="w-4 h-4 text-zinc-400" />
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.locationName)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:underline transition-color text-primary/80"
                                                    >
                                                        {item.locationName}
                                                    </a>
                                                </p>

                                                {item.imageUrl && (
                                                    <div className="w-full h-40 rounded-xl overflow-hidden mb-4 border relative bg-zinc-100 dark:bg-zinc-800/50">
                                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                                    </div>
                                                )}

                                                {item.description && (
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Suggestions Feedback Section */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-8">Minhas Sugestões</h2>
                    {(!suggestions || suggestions.length === 0) ? (
                        <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground bg-zinc-50/50">
                            Você ainda não enviou nenhuma sugestão para este roteiro.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {suggestions.map((sugg: any) => (
                                <div key={sugg.id} className="bg-background border rounded-xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <Badge variant={sugg.status === "APPROVED" ? "default" : sugg.status === "REJECTED" ? "destructive" : "secondary"}>
                                            {sugg.status === "APPROVED" && "Aprovada"}
                                            {sugg.status === "REJECTED" && "Rejeitada"}
                                            {sugg.status === "PENDING" && "Em Análise"}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{new Date(sugg.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3 block">{sugg.content}</p>

                                    {sugg.adminNotes && (
                                        <div className="mt-3 bg-primary/5 border-l-2 border-primary p-3 rounded-r-md">
                                            <span className="text-xs font-bold text-primary block mb-1">Resposta da Agência:</span>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{sugg.adminNotes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

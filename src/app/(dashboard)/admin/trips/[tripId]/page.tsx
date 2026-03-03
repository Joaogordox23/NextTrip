"use client";

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, CalendarDays, Edit, MapIcon, Trash2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useState, use } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const STATUS_MAP: Record<string, string> = {
    PENDING: "Pendente",
    APPROVED: "Aprovada",
    REJECTED: "Rejeitada"
};

const CATEGORY_MAP: Record<string, string> = {
    RESTAURANT: "Restaurante",
    ATTRACTION: "Atração",
    HOTEL: "Hotel",
    TRANSPORT: "Transporte"
};

export default function TripDetailsPage({ params }: { params: Promise<{ tripId: string }> }) {
    const { tripId } = use(params);
    const queryClient = useQueryClient();
    const router = useRouter();

    // Add Item Dialog States
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [isCoverDialogOpen, setIsCoverDialogOpen] = useState(false);
    const [coverImageUrl, setCoverImageUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsUploading(true);
            const res = await fetch("/api/v1/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setter(data.imageUrl);
                toast.success("Imagem enviada com sucesso.");
            } else {
                toast.error(data.error || "Erro ao enviar imagem.");
            }
        } catch {
            toast.error("Falha na conexão de upload.");
        } finally {
            setIsUploading(false);
        }
    };

    const [selectedDayId, setSelectedDayId] = useState("");
    const [itemTitle, setItemTitle] = useState("");
    const [itemLocation, setItemLocation] = useState("");
    const [itemCategory, setItemCategory] = useState("ATTRACTION");
    const [itemCost, setItemCost] = useState("0");
    const [itemDesc, setItemDesc] = useState("");
    const [itemImageUrl, setItemImageUrl] = useState("");
    const [itemStartTime, setItemStartTime] = useState("");
    const [itemEndTime, setItemEndTime] = useState("");

    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-trip', tripId],
        queryFn: async () => {
            // Parallel fetches for performance
            const [tripRes, daysRes, suggRes] = await Promise.all([
                fetch(`/api/v1/trips`), // Reusing to find matching trip ID or create custom
                fetch(`/api/v1/itinerary/days/${tripId}`),
                fetch(`/api/v1/suggestions?tripId=${tripId}`)
            ])

            if (!tripRes.ok || !daysRes.ok) throw new Error('Falha ao carregar detalhes do roteiro');

            const tripData = await tripRes.json();
            const daysData = await daysRes.json();
            const suggData = suggRes.ok ? await suggRes.json() : { suggestions: [] };

            const trip = tripData.trips.find((t: any) => t.id === tripId);

            return { trip, days: daysData.days, suggestions: suggData.suggestions || [] };
        }
    });

    const createItemMutation = useMutation({
        mutationFn: async (newItem: any) => {
            const res = await fetch('/api/v1/itinerary/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            });
            const data = await res.json();
            if (!res.ok) {
                const msg = Array.isArray(data.error) ? data.error.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(", ") : data.error;
                throw new Error(msg || 'Failed to create item');
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-trip', tripId] });
            setIsItemDialogOpen(false);
            toast.success("Atividade adicionada com sucesso!");

            setItemTitle("");
            setItemCost("0");
            setItemDesc("");
            setItemImageUrl("");
            setItemStartTime("");
            setItemEndTime("");
            setEditingItemId(null);
        },
        onError: (error: any) => toast.error(error.message)
    });

    const updateItemMutation = useMutation({
        mutationFn: async (updatedItem: any) => {
            const res = await fetch(`/api/v1/itinerary/items/${editingItemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem)
            });
            const data = await res.json();
            if (!res.ok) {
                const msg = Array.isArray(data.error) ? data.error.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(", ") : data.error;
                throw new Error(msg || 'Failed to update item');
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-trip', tripId] });
            setIsItemDialogOpen(false);
            toast.success("Atividade atualizada com sucesso!");
            setEditingItemId(null);
        },
        onError: (error: any) => toast.error(error.message)
    });

    const deleteTripMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/v1/trips/${tripId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete trip');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
            toast.success("Roteiro excluído com sucesso.");
            router.push('/admin/trips');
        },
        onError: (error: any) => toast.error(error.message)
    });

    const updateTripMutation = useMutation({
        mutationFn: async (updateData: any) => {
            const res = await fetch(`/api/v1/trips/${tripId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update trip');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-trip', tripId] });
            toast.success("Roteiro atualizado com sucesso!");
            setIsCoverDialogOpen(false);
        },
        onError: (error: any) => toast.error(error.message)
    });

    const deleteItemMutation = useMutation({
        mutationFn: async (itemId: string) => {
            const res = await fetch(`/api/v1/itinerary/items/${itemId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete item');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-trip', tripId] });
            toast.success("Atividade excluída com sucesso.");
        },
        onError: (error: any) => toast.error(error.message)
    });

    const resolveSuggestionMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: "APPROVED" | "REJECTED" }) => {
            const res = await fetch(`/api/v1/suggestions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Falha ao avaliar sugestão');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-trip', tripId] });
            toast.success("Sugestão avaliada com sucesso!");
        },
        onError: (error: any) => toast.error(error.message)
    });

    const handleCreateItem = (e: React.FormEvent) => {
        e.preventDefault();

        // Find the day date to construct full DateTime objects for start/end
        const day = data?.days?.find((d: any) => d.id === selectedDayId);
        if (!day) return;

        const dayDate = day.date.split("T")[0]; // YYYY-MM-DD
        // By omitting 'Z', it parses using the browser's local timezone
        const startDateTime = new Date(`${dayDate}T${itemStartTime}:00`).toISOString();
        const endDateTime = new Date(`${dayDate}T${itemEndTime}:00`).toISOString();

        const payload = {
            dayId: selectedDayId,
            title: itemTitle,
            locationName: itemLocation,
            category: itemCategory,
            cost: Number(itemCost),
            description: itemDesc,
            imageUrl: itemImageUrl,
            startTime: startDateTime,
            endTime: endDateTime,
            // Only update geolocation if it's a new item or if we actually geocode
            ...(editingItemId ? {} : { latitude: -23.5505, longitude: -46.6333 })
        };

        if (editingItemId) {
            updateItemMutation.mutate(payload);
        } else {
            createItemMutation.mutate(payload);
        }
    }

    const handleEditItemClick = (item: any, dayId: string) => {
        setSelectedDayId(dayId);
        setEditingItemId(item.id);
        setItemTitle(item.title);
        setItemLocation(item.locationName);
        setItemCategory(item.category || "ATTRACTION");
        setItemCost(String(item.cost));
        setItemDesc(item.description || "");
        setItemImageUrl(item.imageUrl || "");

        // Extract local time (HH:MM) from UTC ISO string for the time inputs
        const startLocal = new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const endLocal = new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        setItemStartTime(startLocal);
        setItemEndTime(endLocal);

        setIsItemDialogOpen(true);
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
                <Link href="/admin/trips">
                    <Button variant="outline" className="mt-4">Voltar para o Painel</Button>
                </Link>
            </div>
        )
    }

    const safeDate = (dateString: string) => {
        if (!dateString) return new Date();
        const base = dateString.split("T")[0];
        return new Date(`${base}T12:00:00`);
    }

    const { trip, days, suggestions } = data;

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-7xl pb-24">
            {/* Header Controls */}
            <div className="flex justify-between items-center mb-6">
                <Link href="/admin/trips">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                            if (confirm("Tem certeza que deseja excluir permanentemente este roteiro?")) {
                                deleteTripMutation.mutate();
                            }
                        }}
                        disabled={deleteTripMutation.isPending}
                    >
                        <Trash2 className="w-4 h-4" /> {deleteTripMutation.isPending ? "Excluindo..." : "Excluir"}
                    </Button>
                    {trip.status === "ACTIVE" ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-green-600 border-green-200 bg-green-50"
                            onClick={() => updateTripMutation.mutate({ status: "DRAFT" })}
                            disabled={updateTripMutation.isPending}
                        >
                            <CheckCircle className="w-4 h-4" /> Publicado
                        </Button>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateTripMutation.mutate({ status: "ACTIVE" })}
                            disabled={updateTripMutation.isPending}
                        >
                            <CheckCircle className="w-4 h-4" /> Liberar Roteiro
                        </Button>
                    )}
                </div>
            </div>

            {/* Hero Info */}
            <div className="bg-zinc-50 dark:bg-zinc-900 border rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
                {trip.coverImage ? (
                    <div className="absolute inset-0 z-0 opacity-20">
                        <img src={trip.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-900 to-transparent" />
                    </div>
                ) : (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none z-0" />
                )}

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <Badge
                            variant="outline"
                            className={`mb-4 bg-background ${trip.status === "ACTIVE" ? "text-green-600 border-green-200" : ""}`}
                        >
                            {trip.status === "ACTIVE" ? "PUBLICADO" : "RASCUNHO"}
                        </Badge>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{trip.title}</h1>
                        <p className="flex items-center gap-2 text-muted-foreground mt-2 text-lg">
                            <MapPin className="w-5 h-5 text-primary" /> {trip.destination}
                        </p>
                        {trip.description && <p className="mt-4 text-zinc-600 dark:text-zinc-400 max-w-2xl">{trip.description}</p>}
                    </div>

                    <div className="hidden md:flex flex-col items-end gap-2 text-right">
                        <Button
                            variant="outline"
                            size="sm"
                            className="mb-2 bg-background/50 backdrop-blur"
                            onClick={() => {
                                setCoverImageUrl(trip.coverImage || "");
                                setIsCoverDialogOpen(true);
                            }}
                        >
                            Alterar Capa
                        </Button>
                        <div className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">Custo Estimado</div>
                        <div className="text-3xl font-black text-primary">R$ {trip.totalCost}</div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 relative z-10">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md border text-sm font-medium">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        {safeDate(trip.startDate).toLocaleDateString()} ao {safeDate(trip.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md border text-sm font-medium">
                        <MapIcon className="w-4 h-4 text-muted-foreground" />
                        {days.length} Dias de Roteiro
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Timeline Column */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold border-b pb-2 mb-4">Cronograma Diário</h2>
                    {days.length === 0 ? (
                        <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground">
                            Nenhum dia de cronograma configurado.
                        </div>
                    ) : (
                        days.map((day: any, i: number) => (
                            <div key={day.id} className="relative pl-6 pb-8 border-l-2 border-primary/20 last:border-0 last:pb-0">
                                {/* Timeline Dot */}
                                <div className="absolute top-0 -left-2 w-4 h-4 bg-primary rounded-full shadow-md shadow-primary/20 border-2 border-background" />

                                <h3 className="font-bold text-lg leading-none pt-0.5 mb-1 text-primary">
                                    Dia {i + 1} - {safeDate(day.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                                </h3>
                                {day.title && <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-4">{day.title}</p>}

                                <div className="space-y-3 mt-4">
                                    {day.items.length === 0 ? (
                                        <div className="text-sm text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-md">
                                            Nenhum local agendado para este dia.
                                        </div>
                                    ) : (
                                        day.items.map((item: any) => (
                                            <div key={item.id} className="bg-background border rounded-lg p-4 shadow-sm hover:shadow transition-shadow group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                        {item.title}
                                                        <div className="flex gap-1 ml-1">
                                                            <button
                                                                onClick={() => handleEditItemClick(item, day.id)}
                                                                className="text-muted-foreground hover:text-primary transition-colors p-1"
                                                                title="Editar Atividade"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm(`Excluir a atividade "${item.title}"?`)) {
                                                                        deleteItemMutation.mutate(item.id);
                                                                    }
                                                                }}
                                                                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                                                                title="Excluir Atividade"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </h4>
                                                    <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-muted-foreground">
                                                        {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                        {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.locationName)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:underline text-primary/80 transition-colors"
                                                    >
                                                        {item.locationName}
                                                    </a>
                                                </p>
                                                {item.imageUrl && (
                                                    <div className="w-full h-32 rounded-md overflow-hidden mb-3 border relative bg-zinc-100 dark:bg-zinc-800">
                                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                {item.description && (
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{item.description}</p>
                                                )}
                                                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                                    <Badge variant="secondary" className="font-normal text-xs">{CATEGORY_MAP[item.category || "ATTRACTION"] || "Atração"}</Badge>
                                                    <span className="text-sm font-semibold">R$ {item.cost}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div className="pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-dashed"
                                            onClick={() => {
                                                setSelectedDayId(day.id);
                                                setEditingItemId(null);
                                                setItemTitle("");
                                                setItemLocation("");
                                                setItemCategory("ATTRACTION");
                                                setItemCost("0");
                                                setItemDesc("");
                                                setItemImageUrl("");
                                                setItemStartTime("");
                                                setItemEndTime("");
                                                setIsItemDialogOpen(true);
                                            }}
                                        >
                                            + Adicionar Atividade
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Suggestions / Side Panel */}
                <div className="space-y-6">
                    <div className="bg-zinc-50 dark:bg-zinc-900 border rounded-xl p-5">
                        <h3 className="font-bold flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Sugestões Pendentes ({suggestions.filter((s: any) => s.status === 'PENDING').length})
                        </h3>
                        {suggestions.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-6">
                                Nenhuma sugestão do cliente aguardando aprovação no momento.
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {suggestions.map((sug: any) => (
                                    <div key={sug.id} className="p-3 border rounded-lg text-sm bg-background">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant={sug.status === 'PENDING' ? 'outline' : 'secondary'} className="text-[10px]">
                                                {STATUS_MAP[sug.status] || sug.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">{new Date(sug.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-zinc-700 dark:text-zinc-300 mb-2">{sug.content}</p>

                                        {/* Detalhes do Autor da Sugestão */}
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                            {sug.user?.image ? (
                                                <img src={sug.user.image} alt="User" className="w-5 h-5 rounded-full object-cover border" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
                                                    {(sug.user?.name || "C").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-xs text-muted-foreground mr-auto">{sug.user?.name || "Cliente"}</span>
                                        </div>

                                        {sug.status === 'PENDING' && (
                                            <div className="flex gap-2 mt-3 pt-2 border-t border-dashed">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="flex-1 h-7 text-[11px] bg-green-600 hover:bg-green-700 px-2"
                                                    onClick={() => resolveSuggestionMutation.mutate({ id: sug.id, status: "APPROVED" })}
                                                    disabled={resolveSuggestionMutation.isPending}
                                                >
                                                    Aprovar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 h-7 text-[11px] text-red-600 border-red-200 hover:bg-red-50 px-2"
                                                    onClick={() => resolveSuggestionMutation.mutate({ id: sug.id, status: "REJECTED" })}
                                                    disabled={resolveSuggestionMutation.isPending}
                                                >
                                                    Rejeitar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogContent className="sm:max-w-[600px] md:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>{editingItemId ? "Editar Atividade" : "Nova Atividade"}</DialogTitle>
                        <DialogDescription>
                            {editingItemId ? "Atualize os detalhes do local ou evento." : "Adicione um novo local ou evento para esta data."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateItem} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Nome do Local / Título</label>
                            <Input required value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="Ex: Museu do Louvre" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Endereço ou Ponto de Refêrencia</label>
                            <Input required value={itemLocation} onChange={(e) => setItemLocation(e.target.value)} placeholder="Ex: Av. Champs-Élysées, Paris" />
                        </div>
                        <div className="space-y-2 text-zinc-800 dark:text-zinc-200">
                            <label className="text-sm font-medium">Horário Início</label>
                            <Input required type="time" value={itemStartTime} onChange={(e) => setItemStartTime(e.target.value)} />
                        </div>
                        <div className="space-y-2 text-zinc-800 dark:text-zinc-200">
                            <label className="text-sm font-medium">Horário Fim</label>
                            <Input required type="time" value={itemEndTime} onChange={(e) => setItemEndTime(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoria</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/50"
                                value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}
                            >
                                <option value="RESTAURANT">Restaurante</option>
                                <option value="ATTRACTION">Atração</option>
                                <option value="HOTEL">Hotel</option>
                                <option value="TRANSPORT">Transporte</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Custo Estimado (R$)</label>
                            <Input type="number" min="0" value={itemCost} onChange={(e) => setItemCost(e.target.value)} placeholder="0.00" />
                        </div>

                        <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                            <label className="text-sm font-medium">Imagem Ilustrativa (Opcional)</label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, setItemImageUrl)}
                                    disabled={isUploading}
                                    className="cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                                {itemImageUrl && (
                                    <div className="h-28 w-full rounded-md overflow-hidden shadow-sm mt-1 border relative border-zinc-200 dark:border-zinc-800">
                                        <img src={itemImageUrl} alt="Imagem Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                            <label className="text-sm font-medium">Anotações Relevantes</label>
                            <Input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Avisos, dicas de ingressos ou tickets..." />
                        </div>

                        <div className="md:col-span-2 flex justify-end mt-2">
                            <Button type="submit" className="w-full md:w-auto px-8 shadow-md" disabled={createItemMutation.isPending || updateItemMutation.isPending}>
                                {createItemMutation.isPending || updateItemMutation.isPending ? "Salvando..." : "Salvar Atividade"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Cover Image Dialog */}
            <Dialog open={isCoverDialogOpen} onOpenChange={setIsCoverDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Capa do Roteiro</DialogTitle>
                        <DialogDescription>
                            Insira um link de imagem (URL) para usar como capa do roteiro.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, setCoverImageUrl)}
                            disabled={isUploading}
                            className="cursor-pointer"
                        />
                        {coverImageUrl && (
                            <div className="w-full h-32 rounded-md overflow-hidden border">
                                <img src={coverImageUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <Button
                            className="w-full"
                            onClick={() => updateTripMutation.mutate({ coverImage: coverImageUrl })}
                            disabled={updateTripMutation.isPending}
                        >
                            {updateTripMutation.isPending ? "Salvando..." : "Salvar Capa"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

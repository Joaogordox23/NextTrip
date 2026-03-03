"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TripCard } from '@/components/features/trips/trip-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, Check, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form States
    const [title, setTitle] = useState("");
    const [destination, setDestination] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [clientIds, setClientIds] = useState<string[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [coverImage, setCoverImage] = useState("");
    const [isUploadingCover, setIsUploadingCover] = useState(false);

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsUploadingCover(true);
            const res = await fetch("/api/v1/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setCoverImage(data.imageUrl);
                toast.success("Capa enviada. Salve o roteiro para confirmar.");
            } else {
                toast.error(data.error || "Erro ao enviar capa.");
            }
        } catch {
            toast.error("Falha na conexão de upload.");
        } finally {
            setIsUploadingCover(false);
        }
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-trips'],
        queryFn: async () => {
            const res = await fetch('/api/v1/trips');
            if (!res.ok) throw new Error('Falha ao carregar roteiros');
            return res.json();
        }
    });

    const { data: clientsData, isLoading: isLoadingClients } = useQuery({
        queryKey: ['admin-clients'],
        queryFn: async () => {
            const res = await fetch('/api/v1/users?role=CLIENT');
            if (!res.ok) throw new Error('Falha ao carregar clientes');
            return res.json();
        }
    });

    const createTripMutation = useMutation({
        mutationFn: async (newTrip: any) => {
            const res = await fetch('/api/v1/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTrip)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create trip');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
            setIsDialogOpen(false);
            toast.success("Roteiro criado com sucesso!");

            setTitle("");
            setDestination("");
            setDescription("");
            setStartDate("");
            setEndDate("");
            setClientIds([]);
            setCoverImage("");
        },
        onError: (error: any) => toast.error(error.message)
    });

    const handleCreateTrip = (e: React.FormEvent) => {
        e.preventDefault();
        createTripMutation.mutate({
            title,
            destination,
            description,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            clientIds,
            coverImage: coverImage || undefined,
        });
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel da Agência</h1>
                    <p className="text-muted-foreground mt-1">Gerencie todos os roteiros e clientes.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-2xl shadow-sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Roteiro
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Roteiro</DialogTitle>
                            <DialogDescription>
                                Preencha as informações bases para criar um planejamento para seu cliente.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateTrip} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Título da Viagem</label>
                                <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Férias na Europa" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Destino Principal</label>
                                <Input required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ex: Paris, França" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Opcional: Resumo Curto</label>
                                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Viagem romântica de 10 dias" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Imagem de Capa (Opcional)</label>
                                <div className="flex flex-col gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverUpload}
                                        disabled={isUploadingCover}
                                        className="cursor-pointer"
                                    />
                                    {coverImage && (
                                        <div className="h-20 w-full rounded-md overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
                                            <img src={coverImage} alt="Capa Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Início</label>
                                    <Input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Fim</label>
                                    <Input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium">Turistas Associados</label>
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCombobox}
                                            className="w-full justify-between h-auto min-h-[40px] font-normal"
                                        >
                                            <span className="truncate flex-1 text-left">
                                                {clientIds.length > 0
                                                    ? `${clientIds.length} cliente(s) selecionado(s)`
                                                    : "Selecione os clientes..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[375px] max-w-[90vw] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Pesquisar por nome ou email..." />
                                            <CommandList>
                                                <CommandEmpty>Nenhum turista encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {isLoadingClients ? (
                                                        <div className="p-2 text-sm text-center text-muted-foreground">Carregando...</div>
                                                    ) : (
                                                        clientsData?.users?.map((user: any) => {
                                                            const isSelected = clientIds.includes(user.id);
                                                            return (
                                                                <CommandItem
                                                                    key={user.id}
                                                                    value={`${user.name} ${user.email}`}
                                                                    onSelect={() => {
                                                                        setClientIds(prev =>
                                                                            isSelected ? prev.filter(id => id !== user.id) : [...prev, user.id]
                                                                        );
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            isSelected ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{user.name}</span>
                                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            )
                                                        })
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {clientIds.length === 0 && <p className="text-xs text-amber-500 mt-1">Selecione pelo menos um turista.</p>}
                            </div>
                            <Button type="submit" className="w-full" disabled={createTripMutation.isPending || clientIds.length === 0}>
                                {createTripMutation.isPending ? "Criando Roteiro..." : "Criar Roteiro"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-[180px] w-full rounded-xl" />
                        </div>
                    ))
                ) : error ? (
                    <div className="col-span-full p-8 text-center text-red-500 bg-red-50 rounded-lg">
                        Ocorreu um erro ao carregar os dados.
                    </div>
                ) : data?.trips.length === 0 ? (
                    <div className="col-span-full p-12 text-center border border-dashed rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                        <h3 className="text-lg font-medium">Nenhum roteiro encontrado</h3>
                        <p className="text-muted-foreground mt-2">Comece criando o primeiro roteiro para um cliente.</p>
                    </div>
                ) : (
                    data?.trips.map((trip: any) => (
                        <Link key={trip.id} href={`/admin/trips/${trip.id}`}>
                            <TripCard trip={trip} />
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}

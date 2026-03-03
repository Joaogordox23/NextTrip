"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth.store';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function ProfileView() {
    const { user, setUser } = useAuthStore();
    const queryClient = useQueryClient();

    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [phone, setPhone] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setUploadingImage(true);
            const res = await fetch("/api/v1/upload", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setImageUrl(data.imageUrl);
                toast.success("Foto enviada. Salve para confirmar.");
            } else {
                toast.error(data.error || "Erro ao enviar imagem.");
            }
        } catch {
            toast.error("Falha na conexão de upload.");
        } finally {
            setUploadingImage(false);
        }
    };

    // Carregar dados reais (do banco)
    const { data: dbUser, isLoading } = useQuery({
        queryKey: ['user-profile', user?.id],
        queryFn: async () => {
            const res = await fetch(`/api/v1/users/${user?.id}`);
            if (!res.ok) throw new Error("Erro ao buscar perfil");
            return res.json();
        },
        enabled: !!user?.id
    });

    useEffect(() => {
        if (dbUser?.user) {
            setName(dbUser.user.name || "");
            setCpf(dbUser.user.cpf || "");
            setPhone(dbUser.user.phone || "");
            setImageUrl(dbUser.user.image || "");
        }
    }, [dbUser]);

    const updateProfileMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await fetch(`/api/v1/users/${user?.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');
            return data;
        },
        onSuccess: (data) => {
            toast.success("Perfil atualizado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });

            // Revalidate general caches that might use avatar
            queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
            queryClient.invalidateQueries({ queryKey: ['client-trips'] });

            // Atualiza Contexto Store Local de Auth UI
            if (data?.user) setUser(data.user);
        },
        onError: (err: any) => toast.error(err.message)
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({ name, cpf, phone, image: imageUrl });
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando Perfil...</div>;

    return (
        <div className="container mx-auto p-4 md:p-6 pb-24 max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Meu Perfil</h1>

            <Card className="border-border shadow-sm">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 rounded-t-xl mb-4">
                    <CardTitle>Configurações da Conta</CardTitle>
                    <CardDescription>Gerencie suas informações pessoais e sua foto exibida nos roteiros.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex flex-col items-center gap-4">
                            <Avatar className="w-32 h-32 border-4 border-background shadow-md">
                                <AvatarImage src={imageUrl || ""} className="object-cover" />
                                <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                    {name.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <p className="text-xs text-muted-foreground font-mono bg-zinc-100 dark:bg-zinc-900 border px-3 py-1 rounded-full">
                                {dbUser?.user?.role}
                            </p>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 space-y-4 w-full">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nome Completo</label>
                                <Input required value={name} onChange={(e) => setName(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CPF</label>
                                    <Input placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Telefone / WhatsApp</label>
                                    <Input placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email <span className="text-muted-foreground text-xs">(Apenas leitura)</span></label>
                                <Input disabled value={dbUser?.user?.email || ""} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Foto de Perfil</label>
                                <div className="flex gap-4 items-center">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        className="cursor-pointer file:cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Escolha uma imagem do seu dispositivo (JPG, PNG).</p>
                            </div>

                            <Button type="submit" className="w-full mt-4" disabled={updateProfileMutation.isPending}>
                                {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

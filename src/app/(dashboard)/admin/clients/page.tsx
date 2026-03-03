"use client";

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users, Phone, FileText, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminClientsPage() {
    const { data: clientsData, isLoading, error } = useQuery({
        queryKey: ['admin-crm-clients'],
        queryFn: async () => {
            const res = await fetch('/api/v1/users?role=CLIENT');
            if (!res.ok) throw new Error('Falha ao carregar clientes');
            return res.json();
        }
    });

    return (
        <div className="container mx-auto p-6 max-w-6xl pb-32">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" /> Gerenciamento de Clientes
                    </h1>
                    <p className="text-muted-foreground mt-1">Consulte informações de contato, documentos e perfis de sua base.</p>
                </div>
            </div>

            <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-red-500 bg-red-50">
                        Ocorreu um erro ao buscar os clientes.
                    </div>
                ) : (!clientsData?.users || clientsData.users.length === 0) ? (
                    <div className="p-16 text-center text-zinc-500">
                        Nenhum cliente cadastrado ainda.
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-zinc-50 dark:bg-zinc-900 border-b">
                            <TableRow>
                                <TableHead className="w-[300px]">Perfil</TableHead>
                                <TableHead>Contato Eletrônico</TableHead>
                                <TableHead>CPF / Documento</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead className="text-right">Cadastrado em</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clientsData.users.map((client: any) => (
                                <TableRow key={client.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <TableCell className="font-medium p-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={client.image || ""} alt={client.name} />
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {client.name?.charAt(0).toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{client.name}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                            <Mail className="w-3.5 h-3.5" />
                                            {client.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-mono text-sm">
                                            <FileText className="w-3.5 h-3.5" />
                                            {client.cpf || <span className="text-zinc-400 italic font-sans text-xs">Pendente</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-mono text-sm">
                                            <Phone className="w-3.5 h-3.5" />
                                            {client.phone || <span className="text-zinc-400 italic font-sans text-xs">Pendente</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    )
}

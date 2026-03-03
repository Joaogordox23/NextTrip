import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function TripCard({ trip }: { trip: any }) {
    const statusColor = {
        DRAFT: 'bg-zinc-200 text-zinc-800',
        ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
        CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    }

    const statusLabel = {
        DRAFT: 'Rascunho',
        ACTIVE: 'Publicado',
        COMPLETED: 'Concluído',
        CANCELLED: 'Cancelado'
    }

    return (
        <Card className="overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer group flex flex-col h-full">
            {trip.coverImage && (
                <div className="h-32 w-full relative overflow-hidden">
                    <img
                        src={trip.coverImage}
                        alt={`Capa do roteiro ${trip.title}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge variant="outline" className={`absolute top-3 right-3 shadow-md border-0 ${statusColor[trip.status as keyof typeof statusColor]} font-semibold`}>
                        {statusLabel[trip.status as keyof typeof statusLabel] || trip.status}
                    </Badge>
                </div>
            )}
            <CardHeader className={`p-4 pb-2 ${trip.coverImage ? 'pt-3' : ''}`}>
                {!trip.coverImage && (
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={`${statusColor[trip.status as keyof typeof statusColor]} font-semibold`}>
                            {statusLabel[trip.status as keyof typeof statusLabel] || trip.status}
                        </Badge>
                    </div>
                )}
                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">{trip.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 text-sm pt-2">
                    <MapPin className="w-4 h-4 text-primary" /> {trip.destination}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>
                        {new Date(trip.startDate).toLocaleDateString('pt-BR')} - {new Date(trip.endDate).toLocaleDateString('pt-BR')}
                    </span>
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t text-sm font-medium">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Dias</span>
                        <span>{trip._count.days}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Sugestões</span>
                        <span className={`font-semibold ${trip._count.suggestions > 0 ? "text-destructive" : ""}`}>
                            {trip._count.suggestions > 0 ? (
                                <span className="flex items-center gap-1 group-hover:scale-105 transition-transform bg-destructive/10 text-destructive px-2 py-0.5 rounded-full text-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                    {trip._count.suggestions} Analisar
                                </span>
                            ) : (
                                "Nenhuma"
                            )}
                        </span>
                    </div>
                    <div className="flex flex-col ml-auto text-right">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Clientes</span>
                        <div className="flex -space-x-2">
                            {trip.clients?.slice(0, 3).map((client: any, i: number) => (
                                <TooltipProvider key={client.id || i}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Avatar className="h-6 w-6 border-2 border-background">
                                                <AvatarImage src={client.image || ""} alt={client.name} />
                                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                    {client.name?.charAt(0).toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">{client.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                            {trip.clients?.length > 3 && (
                                <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium z-10">
                                    +{trip.clients.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

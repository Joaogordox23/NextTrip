import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import * as z from "zod";

const createSuggestionSchema = z.object({
    content: z.string().min(1, "O conteúdo é obrigatório"),
    type: z.enum(["ALTERATION", "NEW_POINT", "REMOVAL"]),
    tripId: z.string().min(1, "Trip ID obrigatório"),
    itemId: z.string().optional(),
    proposedData: z.any().optional(), // JSON config for new markers
});

export async function POST(req: Request) {
    try {
        const role = req.headers.get("x-user-role");
        const userId = req.headers.get("x-user-id");

        if (role !== "CLIENT" || !userId) {
            return NextResponse.json({ error: "Only clients can suggest changes." }, { status: 403 });
        }

        const body = await req.json();
        const data = createSuggestionSchema.parse(body);

        const trip = await prisma.trip.findUnique({
            where: { id: data.tripId },
            include: { clients: true }
        });

        if (!trip || !trip.clients.some((c: any) => c.id === userId)) {
            return NextResponse.json({ error: "Trip não encontrada ou pertencente a outro cliente." }, { status: 404 });
        }

        const suggestion = await prisma.suggestion.create({
            data: {
                content: data.content,
                type: data.type,
                status: "PENDING",
                tripId: data.tripId,
                itemId: data.itemId,
                userId: userId,
                proposedData: data.proposedData ? JSON.stringify(data.proposedData) : undefined,
            },
            include: {
                trip: { select: { title: true } }
            }
        });

        // Logging the user action (Auditing)
        await prisma.auditLog.create({
            data: {
                action: "CREATE_SUGGESTION",
                entityType: "SUGGESTION",
                entityId: suggestion.id,
                userId: userId,
                tripId: trip.id,
                suggestionId: suggestion.id,
            }
        });

        return NextResponse.json({ suggestion }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const role = req.headers.get("x-user-role");
        const userId = req.headers.get("x-user-id");
        const url = new URL(req.url);
        const tripId = url.searchParams.get("tripId");

        let whereClause: any = {};

        if (tripId) {
            const trip = await prisma.trip.findUnique({
                where: { id: tripId },
                include: { clients: true }
            });
            if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

            if (role === "CLIENT") {
                const isClientInTrip = trip.clients.some((c: any) => c.id === userId);
                if (!isClientInTrip) {
                    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
                }
            }
            whereClause = { tripId };
        } else {
            // Se não informou tripId, Client só vê das próprias trips; Admin vê tudo
            if (role === "CLIENT") {
                whereClause = {
                    trip: { clients: { some: { id: userId as string } } }
                };
            }
        }

        const suggestions = await prisma.suggestion.findMany({
            where: whereClause,
            include: {
                user: { select: { id: true, name: true, email: true } },
                item: { select: { id: true, title: true } },
                trip: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ suggestions }, { status: 200 });

    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

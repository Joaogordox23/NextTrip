import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import * as z from "zod";

const createDaySchema = z.object({
    date: z.string().datetime(),
    title: z.string().optional(),
    notes: z.string().optional(),
    tripId: z.string().min(1, "Trip ID é obrigatório"),
});

export async function POST(req: Request) {
    try {
        const role = req.headers.get("x-user-role");
        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const data = createDaySchema.parse(body);

        const trip = await prisma.trip.findUnique({
            where: { id: data.tripId },
        });

        if (!trip) {
            return NextResponse.json({ error: "Trip não encontrada" }, { status: 404 });
        }

        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const dayDate = new Date(data.date);

        if (dayDate < start || dayDate > end) {
            return NextResponse.json({ error: "Data do dia fora do intervalo da viagem" }, { status: 400 });
        }

        const day = await prisma.itineraryDay.create({
            data: {
                date: dayDate,
                title: data.title,
                notes: data.notes,
                tripId: data.tripId,
            },
        });

        return NextResponse.json({ day }, { status: 201 });
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

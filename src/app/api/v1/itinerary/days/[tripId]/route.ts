import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ tripId: string }> }) {
    const { tripId } = await params;
    try {
        const role = req.headers.get("x-user-role");
        const userId = req.headers.get("x-user-id");

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: { clients: true }
        });

        if (!trip) {
            return NextResponse.json({ error: "Trip não encontrada" }, { status: 404 });
        }

        if (role === "CLIENT") {
            const isClientInTrip = trip.clients.some((client: any) => client.id === userId);
            if (!isClientInTrip) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
            }
        }

        const days = await prisma.itineraryDay.findMany({
            where: { tripId },
            include: {
                items: {
                    orderBy: { orderIndex: "asc" }
                }
            },
            orderBy: { date: "asc" }
        });

        return NextResponse.json({ days }, { status: 200 });
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

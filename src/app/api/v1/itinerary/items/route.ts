import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import * as z from "zod";

const createItemSchema = z.object({
    title: z.string().min(1, "O título é obrigatório"),
    description: z.string().optional(),
    locationName: z.string().min(1, "Nome do local é obrigatório"),
    address: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    placeId: z.string().optional(),
    imageUrl: z.string().optional(),
    cost: z.number().default(0),
    category: z.enum(["RESTAURANT", "ATTRACTION", "HOTEL", "TRANSPORT"]).optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    dayId: z.string().min(1, "Dia associado é obrigatório"),
});

export async function POST(req: Request) {
    try {
        const role = req.headers.get("x-user-role");
        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const data = createItemSchema.parse(body);

        const day = await prisma.itineraryDay.findUnique({
            where: { id: data.dayId },
            include: { items: true },
        });

        if (!day) return NextResponse.json({ error: "Dia não encontrado" }, { status: 404 });

        const orderIndex = day.items.length;

        const item = await prisma.itineraryItem.create({
            data: {
                title: data.title,
                description: data.description,
                locationName: data.locationName,
                address: data.address,
                latitude: data.latitude,
                longitude: data.longitude,
                placeId: data.placeId,
                imageUrl: data.imageUrl || null,
                cost: data.cost,
                category: data.category,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                orderIndex,
                dayId: data.dayId,
            },
        });

        return NextResponse.json({ item }, { status: 201 });
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

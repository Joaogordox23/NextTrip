import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import * as z from "zod";

const createTripSchema = z.object({
    title: z.string().min(1, "O título é obrigatório"),
    destination: z.string().min(1, "O destino é obrigatório"),
    description: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    clientIds: z.array(z.string()).min(1, "Selecione pelo menos um cliente"),
    coverImage: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        // Only Admin create trips 
        const role = req.headers.get("x-user-role");
        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const data = createTripSchema.parse(body);

        // Normalize times to UTC noon to prevent timezone boundary issues
        const startDateObj = new Date(data.startDate);
        startDateObj.setUTCHours(12, 0, 0, 0);

        const endDateObj = new Date(data.endDate);
        endDateObj.setUTCHours(12, 0, 0, 0);

        const daysToCreate = [];
        const current = new Date(startDateObj);
        let dayIndex = 1;

        // while loop safely includes the end date now
        while (current <= endDateObj) {
            daysToCreate.push({
                date: new Date(current),
                title: `Dia ${dayIndex}`
            });
            current.setUTCDate(current.getUTCDate() + 1);
            dayIndex++;
        }

        const trip = await prisma.trip.create({
            data: {
                title: data.title,
                destination: data.destination,
                description: data.description,
                coverImage: data.coverImage,
                startDate: startDateObj,
                endDate: endDateObj,
                clients: {
                    connect: data.clientIds.map((id: string) => ({ id }))
                },
                status: "DRAFT",
                days: {
                    create: daysToCreate
                }
            },
        });

        return NextResponse.json({ trip }, { status: 201 });
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

        let trips;

        if (role === "ADMIN") {
            // Admin sees all trips
            trips = await prisma.trip.findMany({
                include: {
                    clients: {
                        select: { id: true, name: true, email: true, image: true }
                    },
                    _count: {
                        select: {
                            days: true,
                            suggestions: { where: { status: "PENDING" } }
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            });
        } else {
            // Client sees only their ACTIVE trips
            trips = await prisma.trip.findMany({
                where: {
                    clients: {
                        some: {
                            id: userId as string
                        }
                    },
                    status: "ACTIVE"
                },
                include: {
                    clients: {
                        select: { id: true, name: true, email: true, image: true }
                    },
                    _count: {
                        select: {
                            days: true,
                            suggestions: { where: { status: "PENDING" } }
                        }
                    }
                },
                orderBy: { startDate: "asc" }
            });
        }

        return NextResponse.json({ trips }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

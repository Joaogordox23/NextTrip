import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ tripId: string }> }) {
    try {
        const role = req.headers.get("x-user-role");

        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Resolving dynamic params
        const { tripId } = await params;

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
        });

        if (!trip) {
            return NextResponse.json({ error: "Roteiro não encontrado." }, { status: 404 });
        }

        // Deleting the trip (Prisma Cascade will delete days, items, and suggestions linked to it)
        await prisma.trip.delete({
            where: { id: tripId },
        });

        return NextResponse.json({ message: "Roteiro deletado com sucesso." }, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ tripId: string }> }) {
    try {
        const role = req.headers.get("x-user-role");

        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { tripId } = await params;
        const body = await req.json();

        // Allow updates to status or coverImage
        const updateData: any = {};
        if (body.status) updateData.status = body.status;
        if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;

        const trip = await prisma.trip.update({
            where: { id: tripId },
            data: updateData,
        });

        return NextResponse.json({ trip }, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}

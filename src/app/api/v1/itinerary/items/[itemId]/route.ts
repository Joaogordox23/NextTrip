import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
    try {
        const role = req.headers.get("x-user-role");

        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { itemId } = await params;
        const body = await req.json();

        const updateData: any = {};
        if (body.title) updateData.title = body.title;
        if (body.locationName) updateData.locationName = body.locationName;
        if (body.category) updateData.category = body.category;
        if (body.cost !== undefined) updateData.cost = body.cost;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
        if (body.startTime) updateData.startTime = new Date(body.startTime);
        if (body.endTime) updateData.endTime = new Date(body.endTime);

        const updatedItem = await prisma.itineraryItem.update({
            where: { id: itemId },
            data: updateData
        });

        return NextResponse.json({ item: updatedItem }, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
    try {
        const role = req.headers.get("x-user-role");

        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { itemId } = await params;

        const item = await prisma.itineraryItem.findUnique({
            where: { id: itemId },
        });

        if (!item) {
            return NextResponse.json({ error: "Atividade não encontrada." }, { status: 404 });
        }

        await prisma.itineraryItem.delete({
            where: { id: itemId },
        });

        return NextResponse.json({ message: "Atividade deletada." }, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}

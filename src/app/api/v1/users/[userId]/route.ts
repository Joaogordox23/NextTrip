import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import * as z from "zod";

const updateUserSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    image: z.string().optional(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;
        const reqUserId = req.headers.get("x-user-id");

        if (reqUserId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, image: true, role: true, cpf: true, phone: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json({ user }, { status: 200 });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;
        const reqUserId = req.headers.get("x-user-id");

        if (reqUserId !== userId) {
            return NextResponse.json({ error: "Unauthorized to update this profile" }, { status: 403 });
        }

        const body = await req.json();
        const data = updateUserSchema.parse(body);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                image: data.image || null,
                cpf: data.cpf || null,
                phone: data.phone || null
            },
            select: { id: true, name: true, email: true, image: true, role: true, cpf: true, phone: true } // Return safe fields
        });

        return NextResponse.json({ user: updatedUser }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

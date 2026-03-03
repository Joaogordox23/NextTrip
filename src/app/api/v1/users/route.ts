import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(req: Request) {
    try {
        const role = req.headers.get("x-user-role");

        // Apenas ADMIN pode ver a lista de clientes para associar as viagens
        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const url = new URL(req.url);
        const searchRole = url.searchParams.get("role");

        const users = await prisma.user.findMany({
            where: searchRole ? { role: searchRole as "CLIENT" | "ADMIN" } : undefined,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                cpf: true,
                phone: true,
                image: true,
                createdAt: true
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({ users }, { status: 200 });
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

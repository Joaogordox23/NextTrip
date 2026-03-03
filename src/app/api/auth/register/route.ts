import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/auth/jwt";
import * as z from "zod";

const registerSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
    email: z.string().email("E-mail inválido."),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
    role: z.enum(["CLIENT", "ADMIN"]).optional().default("CLIENT"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, name, role } = registerSchema.parse(body);

        // Verify if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "E-mail já está em uso." },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                role,
            },
        });

        // Create a token to automatically log them in
        const token = await signToken({
            id: user.id,
            email: user.email,
            role: user.role,
        }, "7d"); // Register log in stays for 7d or similar

        const response = NextResponse.json(
            {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
        );

        // Set cookie
        response.cookies.set({
            name: "accessToken",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}

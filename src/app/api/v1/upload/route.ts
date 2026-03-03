import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize filename to prevent directory traversal and special chars
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${Date.now()}-${sanitizedName}`;

        const uploadDir = join(process.cwd(), "public", "uploads");

        // Ensure directory exists
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const path = join(uploadDir, filename);
        await writeFile(path, buffer);

        // Retorna a URL pública que o navegador usará para renderizar a imagem
        return NextResponse.json({ imageUrl: `/uploads/${filename}` }, { status: 201 });
    } catch (error) {
        console.error("Erro no upload:", error);
        return NextResponse.json(
            { error: "Erro interno no servidor de uploads." },
            { status: 500 }
        );
    }
}

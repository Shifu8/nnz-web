import { NextResponse } from "next/server";
import { registerGiveawayEntry } from "@/lib/db/giveawayStore";
import { handleApiError } from "@/lib/security";

export const runtime = "nodejs";

const FIRST_NAMES = [
  "Mateo", "Santiago", "Sebastián", "Valentina", "Isabella",
  "Benjamín", "Luciana", "Emilia", "Martina", "Gabriel",
  "Samuel", "Daniela", "Camila", "Diego", "Sofía",
  "José", "María", "Luis", "Ana", "Carlos",
  "Andrea", "Jorge", "Laura", "Miguel", "Fernanda",
  "Alejandro", "Paula", "Ricardo", "Elena", "Andrés",
  "Valeria", "Pablo", "Mariana", "Juan", "Catalina",
  "David", "Natalia", "Felipe", "Rosa", "Cristian",
  "Verónica", "Javier", "Patricia", "Pedro", "Gabriela",
  "Manuel", "Mónica", "Ignacio", "Sara", "Oscar",
  "Carolina", "Francisco", "Diana", "Gustavo", "Martha",
  "Eduardo", "Claudia", "Fernando", "Teresa", "Hugo",
  "Ruth", "Iván", "Silvia", "Rubén", "Gloria",
  "Sergio", "Lorena", "Esteban", "Beatriz", "Héctor",
  "Liliana", "Ramiro", "Marcela", "Mauricio", "Julia",
  "Alberto", "Viviana", "Julián", "Adriana", "Bryan",
  "Alejandra", "Kevin", "Xiomara", "Jordy", "Dayana",
  "Doménica", "Anthony", "Zully", "Steven", "Ariana",
  "Bastián", "Scarlett", "Dereck", "Nicole", "Brandon",
  "Ashley", "Isaac", "Alisson", "Dylan", "Danna",
];

const LAST_NAMES = [
  "Quispe", "Condori", "Mamani", "Flores", "García",
  "Rodríguez", "Martínez", "González", "López", "Hernández",
  "Pérez", "Sánchez", "Ramírez", "Torres", "Vargas",
  "Castro", "Rojas", "Ortiz", "Morales", "Silva",
  "Reyes", "Guzmán", "Cruz", "Castillo", "Romero",
  "Chuquimarca", "Jiménez", "Delgado", "Mendoza", "Ramos",
  "Moreno", "Ruiz", "Álvarez", "Medina", "Campos",
  "Vega", "Carrillo", "Peña", "Aguirre", "Salazar",
  "Navarro", "Zambrano", "Correa", "Lozano", "Valencia",
  "Villa", "Bravo", "Soto", "Acosta", "León",
];

function randomPhone(existing: Set<string>): string {
  for (let i = 0; i < 1000; i++) {
    const n = "098" + String(Math.floor(1000000 + Math.random() * 9000000));
    if (!existing.has(n)) return n;
  }
  return "098" + String(Math.floor(1000000 + Math.random() * 9000000));
}

export async function POST() {
  try {
    const count = 100;
    const created: string[] = [];
    const usedPhones = new Set<string>();
    const used: { firstName: string; lastName: string; phone: string }[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const phone = randomPhone(usedPhones);
      usedPhones.add(phone);

      try {
        const { id } = await registerGiveawayEntry({
          firstName,
          lastName,
          phone,
          ip: "127.0.0.1",
          userAgent: "seed-bot",
        });
        created.push(id);
        used.push({ firstName, lastName, phone });
      } catch {
        // skip duplicates
      }
    }

    return NextResponse.json({
      created: created.length,
      participants: used,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

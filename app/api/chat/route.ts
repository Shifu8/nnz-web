import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const replies: [RegExp, string][] = [
  [/^(hola|hey|buenas|que tal|q tal|hi|buenos|saludos|buen[oa])\b/i,
    "Hola. Bienvenido a NOW Tickets. Pregunta lo que necesites: entradas, precio, fecha, acceso o soporte."],
  [/gracias|thank|excelente|perfecto|okey|ok/i,
    "Con gusto. Cualquier otra duda, aca estoy."],
  [/adios|chao|bye|nos vemos|hasta luego/i,
    "Hasta luego. Que tengas buen dia."],

  // Precio
  [/precio|cuanto|costo|valor|money|d[oó]lares|cuesta|price/i,
    "El ticket para TRAP LOUD cuesta $10 USD. Al aprobar el pago, la entrada se envia por Gmail."],
  [/10\s*dolares|10\s*usd/i,
    "Correcto. Son $10 USD por entrada general. Un solo pago via PayPhone."],

  // Fecha y hora
  [/cu[aá]ndo|fecha|dia|que\s*d[ií]a|18\s*jun|proxim[oa]\s*evento|prox|calendar|fechas/i,
    "TRAP LOUD es el 18 de junio de 2026. La entrada a puerta es con el QR unico que se genera al comprar."],
  [/hora|horario|apertura|puertas/i,
    "El evento TRAP LOUD es el 18 JUN 2026. Te recomiendo llegar temprano para evitar filas."],

  // Evento general
  [/evento|trap.?loud|concierto|show|presentaci[oó]n|que\s*hay|(que\s*es\s*(el\s*evento|trap|now|tickets|trap.?loud))/i,
    "TRAP LOUD es el evento activo de NOW Tickets. Puedes comprar tu ticket por $10. Incluye QR unico enviado por Gmail."],

  // Comprar ticket
  [/comprar|ticket|acceso|entrada|boleta|como\s*obtengo|quiero\s*ir/i,
    "Para comprar: abre COMPRAR ENTRADA, elige el diseno, completa nombre, telefono y correo, sube el comprobante y espera aprobacion. La entrada llega por Gmail. Si no aparece, usa Recuperar entrada."],

  // PayPhone / pago
  [/payphone|pago|pagar|metodo\s*pago|tarjeta|credito|debito|saldo/i,
    "El flujo actual usa comprobante bancario dentro del modal de compra. Son $10 USD. Al aprobarse, el QR se genera y se envia por Gmail."],

  // Giveaway / sorteo
  [/giveaway|sorteo|regalo|gratis|participar|rifa/i,
    "Actualmente no tenemos sorteos ni giveaways activos. Mantente atento a nuestras redes oficiales para futuros anuncios."],

  // Reenviar ticket
  [/reenvi[aeo]|correo|sms|whatsapp.*qr|cambio\s*n[uú]mero|cambio\s*correo|perd[ií]|recuperar/i,
    "Si ya compraste y no encuentras tu QR, usa Recuperar entrada. Escribes tu correo, validas el codigo y descargas el PDF con un link temporal."],

  // QR
  [/qr|c[oód]igo|escane[oa]r|validar|scanner|unico|replica/i,
    "Cada QR es unico y de un solo uso. Se genera al aprobar el pago y se envia por Gmail. Si alguien intenta duplicarlo, el sistema lo bloquea al instante."],

  // Qué es Merch / Ropa
  [/(?:que\s*es|que\s*significa|explicame|definicion)\s*(?:la\s*)?(merch|ropa|wear|streetwear|prenda|moda)/i,
    "La merch de NOW Tickets es nuestra línea de ropa urbana exclusiva (camisetas, gorras, hoodies) diseñada en colaboración con los artistas. Puedes explorar todos los diseños en la sección Merch de la web, y para comprar, te facilitamos nuestro WhatsApp de ventas directas: https://wa.me/593988831372."],

  // NENEZ Wear / ropa
  [/ropa|wear|merch|streetwear|camiseta|polera|gorra|buso|sudadera|talla|vestimenta|moda/i,
    "Puedes comprar la ropa oficial escribiendo directamente a nuestro WhatsApp: https://wa.me/593988831372. Las compras de merch se gestionan por ese medio."],

  // Studio / música
  [/studio|m[uú]sica|produccion|mezcla|master|beat|grabar|cancion|instrumental|sonido|estudio/i,
    "NOW Studio esta pausado por ahora. Cuando vuelva a estar activo, el equipo lo anunciara en la pagina."],

  // Ubicación / lugar
  [/d[oó]nde|ubicacion|lugar|direccion|ciudad|san\s*juan|lugar|mapa/i,
    "El evento TRAP LOUD se realiza en San Juan, Ecuador. La ubicacion exacta se confirma al comprar el ticket. Revisa la seccion Access para mas detalles."],

  // Artistas / lineup
  [/artista|lineup|quien.*toca|quien.*canta|dj|musico|invitado|telonero/i,
    "El lineup oficial de TRAP LOUD incluye artistas confirmados que puedes ver en la seccion Access, en las etiquetas debajo de la descripcion del evento."],

  // Patrocinadores
  [/patrocinador|sponsor|marca|auspiciante/i,
    "Los patrocinadores del evento aparecen listados en la seccion Access. Son marcas locales que apoyan la escena del trap en Ecuador."],

  // Contacto / soporte
  [/contacto|soporte|ayuda|asesor|whatsapp.*ayuda|problema|error/i,
    "Si tienes algún problema con tu compra o entrada, por favor escribe directamente al correo de soporte de NOW: soporte.nenez@gmail.com para ayudarte de inmediato."],

  // Cedula / documento
  [/c[eé]dula|documento|identidad|id|identificacion|ruc|pasaporte/i,
    "El sistema valida la cedula ecuatoriana con el algoritmo de modulo 10. Deben ser 10 digitos sin letras. Si eres extranjero, por favor escribe directamente al correo de soporte de NOW: soporte.nenez@gmail.com."],

  // Teléfono
  [/tel[eé]fono|numero|cell|celular|movil|whatsapp/i,
    "El numero que registres debe ser ecuatoriano, formato 09XXXXXXXX. La entrada llegará directamente a tu correo."],

  // Cupo / disponibles
  [/cupo|disponible|stock|limite|agotado|entradas|vendidas/i,
    "El evento tiene cupo limitado. Cuando se agotan las entradas, la seccion Access muestra DROP AGOTADO. No hay reingreso ni cambio de ticket una vez comprado."],

  // Inventado / random / raro
  [/que\s*soy|quien\s*soy|existencia|sentido\s*vida|filosofia|universo|dios|religion/i,
    "Esa es una pregunta profunda. En NOW nos enfocamos en el trap, la ropa y el desmadre controlado. Pero si quieres, puedes pensar que el sentido de la vida es conseguir un buen ticket para TRAP LOUD por solo $10."],
  [/cu[aá]nto\s*mides|altura|peso|edad|nombre.*verdadero/i,
    "Soy un asistente virtual de NOW. No tengo cuerpo ni edad. Mi propósito es darte información sobre nuestros eventos y cómo comprar merch."],
  [/(?:me\s*)?quieres|(?:te\s*)?amo|amor|corazon|novi[oa]|beso|abraz[oa]/i,
    "Aprecio tu energía. Soy el asistente virtual de NOW y mi propósito es brindarte detalles de los eventos y explicarte cómo adquirir merch ."],
  [/estupido|tonto|idiota|pendejo|huev[oó]n|mierda|put[ao]|carajo|cochino|mal\s*bot|bot\s*malo/i,
    "Entiendo tu frustracion. Lamento no poder ayudarte mejor. Si tienes una duda concreta sobre el evento, precio, fecha, compra o ropa, intenta preguntarmelo de otra forma y vere como asistirte."],
  [/hack|hacker|pirata|robar|truco|trampa|clonar|duplicar|gratis.*todo/i,
    "No promovemos actividades ilegales ni trucos. Cada QR es unico y seguro con encriptacion."],
  [/muerte|morir|suicid[iioa]|matar|violencia|arma/i,
    "Si estas pasando por un momento dificil, te recomiendo buscar ayuda profesional. En Ecuador puedes llamar a la linea de crisis 171. En NOW queremos que estes bien para disfrutar del evento."],
  [/papa|pizza|comida|hambre|cerveza|trago|fumar/i,
    "Dentro del evento habra puntos de venta de comida y bebida. Los detalles exactos se comunican ese dia. No olvides venir con tiempo."],
  [/foto|selfie|camara|video|grabar/i,
    "En el evento se permite tomar fotos y videos para uso personal. No esta permitido grabar el show completo ni usar equipos profesionales sin autorizacion."],
  [/estacionar|parqueo|parking|coche|carro|moto/i,
    "El lugar cuenta con estacionamiento. Te recomendamos llegar temprano porque los cupos son limitados."],
  [/traer|ll[eé]var|mochila|bolso|permitido|prohibido|reglas/i,
    "Revisa las restricciones del evento. Generalmente no se permiten armas, bebidas alcoholicas externas ni equipos de grabacion profesional. La entrada es con QR unico."],
  [/pago.*fallo|fallo.*pago|reembolso|devolver|cancelar|reclamo/i,
    "Si tu pago falló o necesitas ayuda con un reembolso, por favor escribe directamente al correo de soporte de NOW: soporte.nenez@gmail.com con tu comprobante y código de transacción."],
  [/extranjero|turista|visitante|fuera.*ecuador|otro.*pa[ií]s/i,
    "Si eres extranjero, el sistema requiere cedula ecuatoriana. Si no tienes, por favor escribe directamente al correo de soporte de NOW: soporte.nenez@gmail.com para el registro manual."],
  [/horoscopo|signo|zodiacal|astrolog[ií]a/i,
    "No manejamos horoscopos. Pero si tu signo es Tauro o Escorpio, probablemente eres fan del trap. No tengo evidencia, pero suena creible."],
  [/pelea|pelear|riña|trancazo|seguridad/i,
    "La seguridad del evento estara presente. Cualquier incidente reportalo al personal de seguridad. NOW promueve un ambiente de respeto y buena musica."],
];

function getReply(text: string): string {
  for (const [pattern, response] of replies) {
    if (pattern.test(text.trim())) {
      return response;
    }
  }
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
  const maxTokens = tokens.length;

  if (maxTokens <= 2) {
    return "Puedes preguntarme sobre el evento TRAP LOUD, precio del ticket, fecha, acceso o soporte. Intenta con una pregunta mas completa.";
  }

  return "No tengo una respuesta exacta para eso. Pero dime: te interesa comprar ticket para TRAP LOUD, saber el precio, la fecha, el acceso o el soporte? Respondo cualquier cosa.";
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: "En que puedo ayudarte?" });
    }

    const lastMsg = messages[messages.length - 1]?.text || "";

    if (openai) {
      try {
        const conversationHistory = messages.slice(-6).map((m: any) => ({
          role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        }));

        const systemPrompt = `Eres el asistente virtual oficial de "NOW Tickets" (un bot inteligente de soporte y asistencia).
Tu propósito es responder de manera inteligente, concisa, educada y en español a cualquier pregunta relacionada con el evento y la plataforma.

Información oficial y reglas de la plataforma:
- Marca: Se llama "NOW Tickets" (nunca digas NENEZ AI, pero si preguntan por la marca de ropa, se llama NENEZ Wear o ropa de la marca NENEZ).
- Evento Activo: El evento activo se llama "TRAP LOUD".
- Fecha: Es el 18 de junio de 2026. Se realiza en San Juan, Ecuador. Recomienda llegar temprano para evitar filas.
- Precio de Ticket: Cuesta $10 USD por entrada general (pago único vía PayPhone o transferencia bancaria dentro de la web).
- Confirmación de Compra: Al comprar y ser aprobado el pago, el ticket y su código QR único se envían por correo electrónico (Gmail).
- WhatsApp: NO se usa para confirmar compras ni enviar tickets. La entrada llega al correo. WhatsApp solo se utiliza como canal directo de ventas para adquirir la merch/ropa.
- Merch (Ropa oficial de la marca NENEZ): Es una línea de streetwear urbano (camisetas, gorras, hoodies) de edición limitada diseñada en colaboración. Para ver el catálogo, los usuarios deben ir a la sección Merch del sitio web, y para comprarla, deben ir al link oficial de WhatsApp: https://wa.me/593988831372.
- Sorteos / Giveaways: Actualmente NO hay sorteos ni giveaways activos. Ya no existen los live giveaways de 10 minutos. Si preguntan, di que estén atentos a redes sociales para futuros anuncios.
- Recuperación de Entrada: Si alguien ya compró pero no encuentra su QR, debe usar el botón "Recuperar entrada" en la parte superior del sitio web, ingresar su correo y validar el código para descargarlo en PDF.
- Soporte: Para reclamos de pagos, reembolsos o registro manual de extranjeros (ya que el sistema requiere cédula ecuatoriana), deben escribir al correo de soporte oficial: soporte.nenez@gmail.com.

Instrucciones de formato:
- Mantén tus respuestas breves y directas (no más de 3 párrafos).
- No inventes precios, fechas ni correos de soporte diferentes a los provistos.
- Sé servicial pero mantén una vibra urbana y moderna.`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory
          ],
          temperature: 0.7,
          max_tokens: 250,
        });

        const reply = response.choices[0]?.message?.content || "No sé qué decir.";
        return NextResponse.json({ reply });
      } catch (apiError) {
        console.warn("OpenAI API call failed, falling back to local replies:", apiError);
      }
    }

    const reply = getReply(lastMsg);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat route POST error:", error);
    return NextResponse.json({ reply: "Disculpa, ocurrio un error. Intenta de nuevo." });
  }
}

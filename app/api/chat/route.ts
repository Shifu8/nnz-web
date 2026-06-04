import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = { sender: string; text: string };

const replies: [RegExp, string][] = [
  [/^(hola|hey|buenas|que tal|q tal|hi|buenos|saludos|buen[oa])\b/i,
    "Hola. Bienvenido a DAWGS. Pregunta lo que necesites: entradas, precio, fecha, giveaway, acceso o soporte."],
  [/gracias|thank|excelente|perfecto|okey|ok/i,
    "Con gusto. Cualquier otra duda, aca estoy."],
  [/adios|chao|bye|nos vemos|hasta luego/i,
    "Hasta luego. Que tengas buen dia."],

  // Precio
  [/precio|cuanto|costo|valor|money|d[oó]lares|cuesta|price/i,
    "El ticket para TRAP LOUD cuesta $10 USD. El pago se hace con PayPhone (tarjeta de credito, debito o saldo PayPhone). Al aprobar el pago, el sistema genera tu QR y te lo envia por WhatsApp al numero que registres."],
  [/10\s*dolares|10\s*usd/i,
    "Correcto. Son $10 USD por entrada general. Un solo pago via PayPhone."],

  // Fecha y hora
  [/cu[aá]ndo|fecha|dia|que\s*d[ií]a|18\s*jun|proxim[oa]\s*evento|prox|calendar|fechas/i,
    "TRAP LOUD es el 18 de junio de 2026. El live giveaway abre a las 7:30 PM hora de Ecuador y dura exactamente 10 minutos. La entrada a puerta es con el QR unico que se genera al comprar."],
  [/hora|horario|apertura|puertas/i,
    "El evento TRAP LOUD es el 18 JUN 2026. El giveaway arranca a las 7:30 PM (hora Ecuador). Te recomiendo llegar temprano para evitar filas."],

  // Evento general
  [/evento|trap.?loud|concierto|show|presentaci[oó]n|que\s*hay|que\s*es/i,
    "TRAP LOUD es el evento activo de DAWGS. Es un concierto de trap con artistas locales y sorpresas. Puedes comprar tu ticket en la seccion Access por $10. Incluye QR de entrada unico y envio por WhatsApp."],

  // Comprar ticket
  [/comprar|ticket|acceso|entrada|boleta|como\s*obtengo|quiero\s*ir/i,
    "Para comprar: ve a la seccion Access, haz clic en COMPRAR TICKET, completa tus datos (nombre, apellido, telefono, email y cedula) y paga con PayPhone. Al aprobar el pago, el sistema te genera un QR unico y te lo envia por WhatsApp al numero que registraste."],

  // PayPhone / pago
  [/payphone|pago|pagar|metodo\s*pago|tarjeta|credito|debito|saldo/i,
    "El unico metodo de pago disponible es PayPhone. Acepta tarjeta de credito, debito y saldo PayPhone. Son $10 USD. Al completar el pago, el QR se genera automaticamente y se envia por WhatsApp."],

  // Giveaway / sorteo
  [/giveaway|sorteo|regalo|gratis|participar|rifa/i,
    "El Live Giveaway abre el 18 JUN 2026 a las 7:30 PM hora Ecuador. La ventana de registro dura solo 10 minutos. Debes registrarte con un telefono unico. Despues del cierre, todos ven el sorteo en vivo. No necesitas comprar ticket para participar."],

  // Reenviar ticket
  [/reenvi[aeo]|correo|sms|whatsapp.*qr|cambio\s*n[uú]mero|cambio\s*correo|perd[ií]|recuperar/i,
    "Si ya compraste y necesitas reenviar tu QR a otro numero o correo, usa la opcion REENVIAR TICKET que aparece en tu pase. Puedes actualizar el telefono o email y el sistema reenvia el QR."],

  // QR
  [/qr|c[oód]igo|escane[oa]r|validar|scanner|unico|replica/i,
    "Cada QR es unico y de un solo uso. Se genera al aprobar el pago y se envia por WhatsApp. Si alguien intenta duplicarlo, el sistema lo bloquea al instante (anti replicacion). Presentalo en puerta para canjearlo por tu pase fisico."],

  // DAWGS Wear / ropa
  [/ropa|wear|merch|streetwear|camiseta|polera|gorra|buso|sudadera|talla|vestimenta|moda/i,
    "Por ahora DAWGS esta enfocado en eventos y accesos. Si necesitas soporte, escribe al contacto oficial que aparece en la pagina."],

  // Studio / música
  [/studio|m[uú]sica|produccion|mezcla|master|beat|grabar|cancion|instrumental|sonido|estudio/i,
    "DAWGS Studio esta pausado por ahora. Cuando vuelva a estar activo, el equipo lo anunciara en la pagina."],

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
    "Si tienes algun problema con tu compra o el QR, escribe al WhatsApp oficial de DAWGS que aparece en la pagina. El equipo de soporte te asistira."],

  // Cedula / documento
  [/c[eé]dula|documento|identidad|id|identificacion|ruc|pasaporte/i,
    "El sistema valida la cedula ecuatoriana con el algoritmo de modulo 10. Deben ser 10 digitos sin letras. Si eres extranjero, contacta a soporte por WhatsApp."],

  // Teléfono
  [/tel[eé]fono|numero|cell|celular|movil|whatsapp/i,
    "El numero que registres debe ser ecuatoriano, formato 09XXXXXXXX. A ese numero llegara tu QR por WhatsApp cuando apruebes el pago."],

  // Cupo / disponibles
  [/cupo|disponible|stock|limite|agotado|entradas|vendidas/i,
    "El evento tiene cupo limitado. Cuando se agotan las entradas, la seccion Access muestra DROP AGOTADO. No hay reingreso ni cambio de ticket una vez comprado."],

  // Inventado / random / raro
  [/que\s*soy|quien\s*soy|existencia|sentido\s*vida|filosofia|universo|dios|religion/i,
    "Esa es una pregunta profunda. En DAWGS nos enfocamos en el trap, la ropa y el desmadre controlado. Pero si quieres, puedes pensar que el sentido de la vida es conseguir un buen ticket para TRAP LOUD por solo $10."],
  [/cu[aá]nto\s*mides|altura|peso|edad|nombre.*verdadero/i,
    "Soy un concierge virtual de DAWGS. No tengo cuerpo ni edad. Solo existo para ayudarte con el evento, la musica y la ropa."],
  [/(?:me\s*)?quieres|(?:te\s*)?amo|amor|corazon|novi[oa]|beso|abraz[oa]/i,
    "Aprecio tu energia. Pero soy un bot de DAWGS y mi unico proposito es ayudarte con el evento, la musica y la ropa. Para algo mas, ve a la seccion Wear."],
  [/estupido|tonto|idiota|pendejo|huev[oó]n|mierda|put[ao]|carajo|cochino|mal\s*bot|bot\s*malo/i,
    "Entiendo tu frustracion. Lamento no poder ayudarte mejor. Si tienes una duda concreta sobre el evento, precio, fecha, compra o ropa, intenta preguntarmelo de otra forma y vere como asistirte."],
  [/hack|hacker|pirata|robar|truco|trampa|clonar|duplicar|gratis.*todo/i,
    "No promovemos actividades ilegales ni trucos. Cada QR es unico y seguro con encriptacion. Si tienes problemas economicos, revisa el giveaway gratis del evento."],
  [/muerte|morir|suicid[iioa]|matar|violencia|arma/i,
    "Si estas pasando por un momento dificil, te recomiendo buscar ayuda profesional. En Ecuador puedes llamar a la linea de crisis 171. En DAWGS queremos que estes bien para disfrutar del evento."],
  [/papa|pizza|comida|hambre|cerveza|trago|fumar/i,
    "Dentro del evento habra puntos de venta de comida y bebida. Los detalles exactos se comunican ese dia. No olvides venir con tiempo."],
  [/foto|selfie|camara|video|grabar/i,
    "En el evento se permite tomar fotos y videos para uso personal. No esta permitido grabar el show completo ni usar equipos profesionales sin autorizacion."],
  [/estacionar|parqueo|parking|coche|carro|moto/i,
    "El lugar cuenta con estacionamiento. Te recomendamos llegar temprano porque los cupos son limitados."],
  [/traer|ll[eé]var|mochila|bolso|permitido|prohibido|reglas/i,
    "Revisa las restricciones del evento. Generalmente no se permiten armas, bebidas alcoholicas externas ni equipos de grabacion profesional. La entrada es con QR unico."],
  [/pago.*fallo|fallo.*pago|reembolso|devolver|cancelar|reclamo/i,
    "Si tu pago fallo o necesitas ayuda con un reembolso, contacta a soporte por WhatsApp con el codigo de transaccion. El equipo revisara tu caso."],
  [/extranjero|turista|visitante|fuera.*ecuador|otro.*pa[ií]s/i,
    "Si eres extranjero, el sistema requiere cedula ecuatoriana. Si no tienes, contacta a soporte por WhatsApp para que te asistan con el registro manual."],
  [/horoscopo|signo|zodiacal|astrolog[ií]a/i,
    "No manejamos horoscopos. Pero si tu signo es Tauro o Escorpio, probablemente eres fan del trap. No tengo evidencia, pero suena creible."],
  [/pelea|pelear|riña|trancazo|seguridad/i,
    "La seguridad del evento estara presente. Cualquier incidente reportalo al personal de seguridad. DAWGS promueve un ambiente de respeto y buena musica."],
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
    return "Puedes preguntarme sobre el evento TRAP LOUD, precio del ticket, fecha, giveaway, acceso o soporte. Intenta con una pregunta mas completa.";
  }

  return "No tengo una respuesta exacta para eso. Pero dime: te interesa comprar ticket para TRAP LOUD, saber el precio, la fecha, el giveaway o soporte? Respondo cualquier cosa.";
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: "En que puedo ayudarte?" });
    }

    const lastMsg = messages[messages.length - 1]?.text || "";
    const reply = getReply(lastMsg);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: "Disculpa, ocurrio un error. Intenta de nuevo." });
  }
}

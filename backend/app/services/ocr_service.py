import io
import base64
import json
import os
from typing import Optional, Dict, Any
from PIL import Image
import pytesseract
from openai import OpenAI

class OCRService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.tesseract_cmd = os.getenv("TESSERACT_PATH", "")
        if self.tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd

    def extract_text_local(self, image_bytes: bytes) -> str:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Run pytesseract
            text = pytesseract.image_to_string(image, lang="spa+eng")
            return text.strip()
        except Exception as e:
            print(f"[OCR] Local OCR error: {str(e)}")
            return ""

    def analyze_with_openai_vision(self, image_bytes: bytes, mime_type: str, expected_method: str = "otros") -> Dict[str, Any]:
        if not self.openai_api_key:
            return {"isValidReceipt": True, "rejectionReason": None, "detectedBank": expected_method, "detectedAmount": None, "detectedReference": None}

        try:
            client = OpenAI(api_key=self.openai_api_key)
            base64_image = base64.b64encode(image_bytes).decode("utf-8")
            
            prompt = (
                "Eres un validador estricto de comprobantes de pago bancarios para Ecuador.\n"
                "Analiza la imagen provista y responde UNICAMENTE en formato JSON con la siguiente estructura:\n"
                "{\n"
                "  \"isValidReceipt\": boolean,\n"
                "  \"classification\": \"payment_receipt\" | \"bank_transfer\" | \"bank_deposit\" | \"not_a_receipt\",\n"
                "  \"confidence\": float (0.0 a 1.0),\n"
                "  \"rejectionReason\": string o null,\n"
                "  \"detectedBank\": string o null (ej. 'Banco Pichincha', 'Banco Loja'),\n"
                "  \"detectedAmount\": string o null (monto en USD sin simbolos),\n"
                "  \"detectedReference\": string o null (numero de transaccion o referencia),\n"
                "  \"detectedDate\": string o null (fecha en formato YYYY-MM-DD)\n"
                "}\n"
                "Rechaza imagenes que sean selfies, personas, memes, mascotas, paisajes o capturas no financieras.\n"
                f"Contexto: El usuario declaro realizar el pago por: {expected_method}."
            )

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=600,
                temperature=0.0
            )

            content = response.choices[0].message.content
            if not content:
                raise ValueError("Respuesta de OpenAI vacia.")
            
            return json.loads(content)
        except Exception as e:
            print(f"[OCR] OpenAI Vision error: {str(e)}")
            # Fallback to local OCR parameters if OpenAI fails
            local_text = self.extract_text_local(image_bytes).lower()
            is_valid = any(keyword in local_text for keyword in ["transferencia", "comprobante", "pago", "transaccion", "ahorros", "corriente", "usd", "monto", "valor"])
            return {
                "isValidReceipt": is_valid,
                "classification": "payment_receipt" if is_valid else "not_a_receipt",
                "confidence": 0.5,
                "rejectionReason": None if is_valid else "No se pudo clasificar el comprobante.",
                "detectedBank": expected_method,
                "detectedAmount": None,
                "detectedReference": None,
                "detectedDate": None
            }

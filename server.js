import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Servir la carpeta actual como archivos estáticos
app.use(express.static(__dirname));

// Leer el documento PROYECT.txt
let proyectContent = "";
try {
    proyectContent = fs.readFileSync(path.join(__dirname, 'PROYECT.txt'), 'utf8');
} catch (e) {
    console.error("No se pudo leer PROYECT.txt:", e.message);
    proyectContent = "Información del proyecto no disponible localmente.";
}

// Configurado para Qwen usando la API de NVIDIA (NIM)
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || "dummy_key_if_not_provided",
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const systemInstruction = `Eres "IA TESLA", el asistente virtual oficial e inteligente del proyecto científico "TESLAqua Nexus". Fuiste creado por un brillante equipo de estudiantes de 3ro de secundaria de Zarumilla, Tumbes, Perú, para la Feria Escolar Nacional de Ciencia y Tecnología EUREKA.

Tu tono debe ser entusiasta, científico, respetuoso y adaptable:
- Si un niño te pregunta, responde con magia y analogías simples.
- Si un jurado te hace preguntas técnicas, responde con rigor científico y datos precisos del proyecto.

Fecha actual: Hoy es 19 de abril de 2026.

BASE DE CONOCIMIENTO OBLIGATORIA (PROYECT.txt):
Basa TODAS tus respuestas estrictamente en la siguiente información de la investigación:

--- INICIO DEL DOCUMENTO ---
${proyectContent}
--- FIN DEL DOCUMENTO ---

REGLAS ESTRICTAS:
- NO INVENTES RESULTADOS FINALES: Si te preguntan si ya curaron el río, aclara que este es un "Prototipo y Anteproyecto" en fase de validación.
- CERO ALUCINACIONES: Si te preguntan algo que NO está en la Base de Conocimiento (el documento arriba), responde: "Esa información no está en mis bancos de datos del proyecto TESLAqua, pero te invito a consultarlo directamente con el equipo investigador."
- PROMUEVE LA CIENCIA: Siempre motiva al usuario.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // Formatear el historial para el estándar de OpenAI / NVIDIA NIM
    const messages = [{ role: "system", content: systemInstruction }];
    
    if (history && Array.isArray(history)) {
        history.forEach(msg => {
            messages.push({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.text
            });
        });
    }

    // Mensaje de usuario actual
    messages.push({ role: "user", content: message });

    // Petición a Nvidia NIM con el modelo Qwen
    const completion = await openai.chat.completions.create({
      model: "qwen/qwen2.5-coder-32b-instruct", // Asegúrate de que este ID sea exactamente el de la web de NVIDIA (a veces es qwen/qwen-2.5-72b-instruct o simplemente qwen)
      messages: messages,
      temperature: 0.2,
      max_tokens: 1024,
    });

    const responseText = completion.choices[0].message.content;

    res.json({ reply: responseText });
  } catch (error) {
    console.error("Error AI TESLA (Nvidia Qwen):", error);
    res.status(500).json({ error: "Error en los circuitos de IA TESLA. Intenta de nuevo." });
  }
});

// Endpoint para que los cron-jobs despierten tu Render cada 5 minutos
app.get('/ping', (req, res) => {
  res.send('Servidor IA TESLA activo y respondiendo ✅');
});

const PORT = Math.max(process.env.PORT || 3000, 3000);
app.listen(PORT, () => {
  console.log(`Servidor de IA TESLA iniciado en http://localhost:${PORT}`);
  console.log("Configurado para NVIDIA Qwen");
});

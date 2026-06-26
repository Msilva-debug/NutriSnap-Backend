# NutriSnap Backend

Backend de NutriSnap construido con NestJS, TypeORM y PostgreSQL. La API maneja usuarios, autenticacion JWT, comidas, notas diarias, analisis de imagenes con Gemini y recomendaciones nutricionales con contexto historico.

## Requisitos

- Node.js
- PostgreSQL
- Una API key de Gemini para analisis con IA

## Instalacion

```bash
npm install
```

## Variables De Entorno

Crear un archivo `.env` en la raiz del proyecto. Este archivo esta ignorado por Git.

```env
PORT=8080
JWT_SECRET=dev-jwt-secret
JWT_EXPIRES_IN=1d
GEMINI_API_KEY=tu_api_key_de_gemini
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
```

`GEMINI_EMBEDDING_MODEL` es opcional. Si no se define, el backend usa `gemini-embedding-2`.

## Ejecutar El Proyecto

```bash
npm run start:dev
```

## Tests

```bash
npm test
```

## Embeddings De Texto

NutriSnap utiliza text embeddings para crear una memoria semantica alimenticia por usuario.

Un embedding convierte texto en un vector numerico. Textos con significados parecidos quedan cerca entre si, aunque no usen exactamente las mismas palabras. Esto permite buscar notas anteriores similares al periodo actual y usarlas como contexto adicional para la IA.

Documentacion oficial de Gemini Embeddings:

https://ai.google.dev/gemini-api/docs/embeddings

## Para Que Se Usan Los Embeddings

Los embeddings se usan para mejorar las recomendaciones nutricionales. No reemplazan los calculos estructurados de calorias, proteinas, carbohidratos o grasas. Esos calculos siguen saliendo desde SQL y reglas del backend.

La funcion del embedding es encontrar patrones historicos parecidos, por ejemplo:

- dias con mucho arroz y poca proteina
- notas donde el usuario menciona pesadez o baja variedad
- rangos con comidas repetidas
- periodos con alta concentracion de calorias en una sola comida

Luego esos textos similares se agregan al prompt de Gemini como memoria historica.

## Tabla De Embeddings

Los embeddings se guardan en:

```text
food_text_embeddings
```

Campos principales:

```text
userId       -> usuario propietario del texto
sourceType   -> daily_note
sourceId     -> id de daily_food_notes
content      -> texto usado para crear el embedding
embedding    -> vector guardado como JSONB
model        -> modelo Gemini usado
dimensions   -> cantidad de dimensiones del vector
```

Se guarda como `JSONB` para evitar depender de extensiones como `pgvector` en esta etapa. La similitud se calcula en TypeScript usando similitud coseno.

## Flujo De Embeddings

Cuando se guarda o edita una nota diaria:

```text
PATCH /meal/history/note
  -> guarda daily_food_notes
  -> obtiene comidas del mismo usuario y fecha
  -> genera embedding con nota, comidas, macros totales y resumen automatico del patron
  -> guarda o actualiza food_text_embeddings
```

Todos los dias a las 11:58 PM, hora Colombia:

```text
cron diario
  -> busca las notas de la fecha actual
  -> valida si la nota ya tiene embedding
  -> crea solo los embeddings faltantes con nota, comidas, macros y resumen del patron
```

Cuando se piden recomendaciones:

```text
GET /recommendations
  -> obtiene comidas y notas del periodo
  -> genera un embedding temporal del contexto actual
  -> busca textos historicos similares del mismo usuario
  -> manda a Gemini:
     - notas del usuario
     - comidas del usuario por dia
     - memoria semantica historica similar
```

Para generar embeddings de datos existentes se puede ejecutar un backfill protegido con JWT:

```http
POST /recommendations/embeddings/backfill
```

Este endpoint toma el usuario autenticado desde el JWT y genera embeddings para sus registros actuales en:

```text
daily_food_notes
```

## Recomendaciones

Endpoint protegido con JWT:

```http
GET /recommendations
```

Ejemplos:

```http
GET /recommendations?period=daily&date=2026-06-17
GET /recommendations?period=range&startDate=2026-06-01&endDate=2026-06-17
```

Respuesta:

```json
{
  "period": "daily",
  "summary": "Resumen cualitativo del periodo analizado",
  "comparison": {
    "available": true,
    "summary": "El segundo mes muestra mejor presencia de proteina frente al primero, aunque se mantiene una alta repeticion de arroz.",
    "improvements": [
      {
        "category": "Proteina",
        "description": "En el segundo mes aparecen mas comidas con pollo, huevos o atun frente al primero."
      }
    ],
    "needsAttention": [
      {
        "category": "Variedad",
        "description": "Se mantiene una presencia alta de arroz y pocas verduras en varias comidas."
      }
    ],
    "stablePatterns": [
      {
        "category": "Casero",
        "description": "La preferencia por comidas caseras se mantiene entre el primer y segundo mes."
      }
    ]
  },
  "recommendations": [
    {
      "category": "Proteinas",
      "title": "Refuerza tu comida principal",
      "description": "Podrias reducir una parte del arroz y agregar huevos, pollo o lentejas para mejorar proteina y saciedad."
    }
  ]
}
```

## Notas Tecnicas

- Los embeddings son una tecnica de IA, no un patron de diseno.
- El patron de diseno usado para recomendaciones es Strategy + Factory.
- `daily` y `range` tienen estrategias separadas.
- Gemini genera recomendaciones cuando `GEMINI_API_KEY` esta configurada.
- Si Gemini falla, el backend responde con recomendaciones calculadas por reglas simples.

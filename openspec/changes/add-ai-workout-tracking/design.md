# Diseno: seguimiento de entrenamiento asistido por IA

## Objetivos de diseno

- Reducir al minimo la escritura mientras la persona esta entrenando.
- Funcionar tanto para principiantes como para usuarios avanzados sin crear dos apps.
- Tratar la IA como asistente falible: propone y estructura, pero el usuario confirma.
- Mantener un contrato estable entre frontend y backend mediante OpenAPI.
- Ser seguro ante consultas de dolor y respetar la privacidad de las imagenes.

## Experiencia propuesta

### 1. Inicio de sesion de entrenamiento

La pantalla ofrece tres acciones equivalentes:

1. **Tomar foto** de una maquina.
2. **Elegir maquina** desde busqueda o favoritos.
3. **Describir actividad** por texto o voz.

El modo manual siempre permanece disponible; la IA no bloquea el registro.

### 2. Analisis y confirmacion

Mientras se analiza la imagen, el frontend muestra una vista previa y un estado de
progreso cancelable. La respuesta propone hasta tres candidatos con:

- nombre comun de la maquina;
- ejercicio probable;
- modalidad (`strength` o `cardio`);
- grupos musculares principales;
- nivel de confianza entre 0 y 1;
- preguntas necesarias para completar el registro.

Si la confianza del primer candidato es menor a `0.75`, la interfaz no lo preselecciona
como verdad: presenta los candidatos y la opcion "Ninguna; elegir manualmente". Incluso
con confianza alta, el usuario debe confirmar antes de guardar.

### 3. Registro contextual

En movil se recomienda una **bottom sheet expandible** en lugar de un modal centrado:
mantiene visible la foto/maquina, se usa mejor con una mano y puede crecer para mostrar
campos avanzados. En escritorio puede representarse como panel lateral.

#### Fuerza

El formulario basico solicita numero planeado de series y permite registrar cada serie:

- repeticiones completadas (requerido);
- carga y unidad (opcional);
- esfuerzo percibido RPE/RIR (opcional, visible en modo avanzado);
- nota y estado de calentamiento (opcionales);
- descanso, con temporizador opcional.

Al guardar una serie se crea automaticamente la siguiente hasta completar el plan. El
usuario puede agregar, omitir, reordenar o corregir series.

#### Cardio

El formulario adapta sus campos a la maquina. Para caminadora muestra duracion,
velocidad, inclinacion y distancia; no inventa valores que el usuario no proporciono.
La descripcion "hice 30 minutos a 5.0 con una inclinacion de 5" se transforma en una
propuesta editable. La unidad de velocidad debe confirmarse desde las preferencias del
usuario o presentarse como desconocida.

### 4. Recomendaciones

La accion "Recomiendame como usarla" abre una conversacion contextual que conoce solo:

- maquina confirmada;
- nivel declarado (`beginner`, `intermediate`, `advanced`);
- objetivo elegido;
- datos relevantes de la sesion y preferencias autorizadas;
- limitaciones que el usuario haya indicado voluntariamente.

Para principiantes prioriza ajuste de la maquina, tecnica general, carga conservadora y
una forma simple de empezar. Para avanzados puede hablar de RPE/RIR, progresion, volumen
y descansos, sin afirmar que una sugerencia generica es una prescripcion individual.

## Seguridad ante dolor

El texto se evalua primero con reglas deterministas y clasificacion estructurada. La IA
generativa solo redacta orientacion dentro del resultado permitido.

### Niveles

- `emergency`: dolor de pecho, dificultad respiratoria intensa, desmayo, confusion,
  debilidad repentina u otra senal grave. Indicar detenerse y buscar servicios de
  emergencia locales de inmediato.
- `stop_and_seek_help`: dolor intenso o repentino, deformidad, perdida de fuerza o
  sensibilidad, incapacidad para mover/apoyar, o empeoramiento rapido. Indicar detener
  el ejercicio y buscar evaluacion profesional pronta.
- `caution`: molestia sin senales de alarma. Indicar detener la serie, no entrenar a
  traves del dolor, reducir o evitar el movimiento y consultar a un profesional si
  persiste o se repite.

El sistema puede formular preguntas breves para detectar urgencia, pero no debe
diagnosticar, recomendar medicacion ni asegurar que continuar es seguro. El aviso debe
ser visible y la conversacion debe permitir contactar ayuda, no esconderla tras pasos.

## Modelo de dominio propuesto

### `WorkoutSession`

- `id`, `userId`, `startedAt`, `endedAt`, `status`, `notes`

### `ExerciseEntry`

- `id`, `sessionId`, `equipmentId`, `exerciseName`, `modality`, `source`
- `imageId`, `aiConfidence`, `userConfirmed`, `notes`, `order`

### `StrengthSet`

- `id`, `exerciseEntryId`, `setNumber`, `repetitions`, `weight`, `weightUnit`
- `rpe`, `rir`, `restSeconds`, `isWarmup`, `completedAt`

### `CardioEntry`

- `id`, `exerciseEntryId`, `durationSeconds`, `speed`, `speedUnit`
- `inclinePercent`, `distance`, `distanceUnit`, `resistanceLevel`

### `EquipmentAnalysis`

- `id`, `userId`, `imageId`, `status`, `candidates`, `rawDescription`
- `model`, `confidence`, `confirmedEquipmentId`, `createdAt`

Las respuestas crudas del proveedor no deben convertirse directamente en entidades. Se
validan contra DTO/esquema, se normalizan y se conserva solamente lo necesario para
auditoria y mejora del producto.

## Contrato API propuesto

```text
POST   /workouts/sessions
GET    /workouts/sessions/:id
PATCH  /workouts/sessions/:id
POST   /workouts/equipment/analyze
POST   /workouts/parse-description
POST   /workouts/sessions/:id/exercises
PATCH  /workouts/exercises/:id
POST   /workouts/exercises/:id/sets
PATCH  /workouts/sets/:id
POST   /workouts/exercises/:id/cardio
POST   /workouts/advice
POST   /workouts/pain-guidance
```

Todos requieren JWT, salvo una futura consulta publica de catalogo si se decide
explicitamente. Las mutaciones aceptan una clave de idempotencia para evitar duplicados
por mala conectividad. El analisis de imagen puede responder `202 Accepted` y un
identificador de trabajo si supera el presupuesto de latencia sincrona.

## Respuesta estructurada de analisis

```json
{
  "analysisId": "uuid",
  "status": "completed",
  "candidates": [
    {
      "equipmentId": "uuid-or-null",
      "displayName": "Press de pecho",
      "modality": "strength",
      "confidence": 0.86,
      "muscleGroups": ["chest", "triceps"],
      "suggestedFields": ["plannedSets", "repetitions", "weight"]
    }
  ],
  "requiresConfirmation": true,
  "warnings": []
}
```

## Arquitectura

- `WorkoutModule`: sesiones, ejercicios y persistencia.
- `EquipmentRecognitionService`: proveedor de vision detras de una interfaz.
- `WorkoutDescriptionParser`: convierte texto en una propuesta estructurada.
- `WorkoutAdviceService`: recomendaciones por nivel y objetivo.
- `PainSafetyService`: reglas y clasificacion de seguridad antes del generador.
- Adaptador de almacenamiento de imagenes con URL firmada y borrado verificable.

No se reutiliza el agente de recomendaciones nutricionales: entrenamiento y nutricion
pueden compartir infraestructura de proveedor, pero no prompts ni reglas de dominio.

## Privacidad y observabilidad

- Remover metadatos EXIF antes de almacenar o enviar al proveedor.
- Cifrar transporte y almacenamiento; usar URL firmadas de corta duracion.
- Registrar consentimiento, finalidad y fecha de eliminacion.
- Evitar imagenes, texto libre y datos de salud en logs de aplicacion.
- Medir latencia, tasa de correccion humana, confianza, fallos y costo por analisis.
- Auditar separadamente respuestas de seguridad, con datos minimizados.

## Degradacion

- Sin permiso de camara: selector de archivo y busqueda manual.
- Sin red: borrador local y sincronizacion idempotente posterior.
- IA no disponible: registro manual sin bloquear la sesion.
- Respuesta invalida: descartarla, informar el error y no guardar inferencias parciales.
- Recomendacion no disponible: mostrar pautas estaticas revisadas, no texto improvisado.

## Despliegue gradual

1. Contratos y persistencia detras de `workout_tracking`.
2. Registro manual interno.
3. Analisis de imagen para un catalogo limitado de maquinas.
4. Interpretacion de texto y recomendaciones para usuarios voluntarios.
5. Ampliacion basada en tasa de confirmacion, seguridad y costo, no solo uso.

## Preguntas abiertas

- ¿El frontend sera web/PWA, React Native, Flutter u otra tecnologia?
- ¿Se conservara la imagen original o solo una version temporal procesada?
- ¿Que paises se soportaran primero para localizar unidades y numeros de emergencia?
- ¿Las recomendaciones usaran historial de entrenamiento desde el MVP?

# Propuesta: seguimiento de entrenamiento asistido por IA

## Por que

NutriSnap ya permite convertir una foto y una descripcion en informacion alimenticia
util. El producto necesita extender esa experiencia al gimnasio para que una persona,
sin importar si esta empezando o si ya entrena de forma avanzada, pueda registrar una
sesion sin conocer de antemano el nombre exacto de cada maquina ni completar un
formulario largo.

Una foto por si sola no es suficiente: el sistema debe confirmar lo que cree haber
reconocido, recoger la informacion que cambia durante el ejercicio (series,
repeticiones, peso, duracion, velocidad o inclinacion) y conservar siempre una forma
manual de corregir el resultado. Tambien debe responder con prudencia cuando el usuario
menciona dolor.

## Que cambia

- Se agrega un flujo mobile-first para fotografiar o seleccionar una maquina de gym.
- La IA propone el tipo de maquina, ejercicio, grupo muscular y campos relevantes,
  mostrando su nivel de confianza y solicitando confirmacion humana.
- Para ejercicios de fuerza se ofrece un registro guiado serie por serie con
  repeticiones, carga, esfuerzo percibido y descanso opcionales.
- Para cardio se ofrece un formulario adecuado a la maquina con duracion, velocidad,
  inclinacion, distancia y resistencia, segun corresponda.
- Se acepta una descripcion libre como "hare 3 series" o "hice 30 minutos a 5.0 con
  inclinacion 5" para precargar los campos sin eliminar la posibilidad de editarlos.
- Se agregan recomendaciones adaptadas al nivel, objetivo e historial del usuario.
- Se agrega un flujo de consulta contextual durante un ejercicio, incluida la mencion
  de dolor, con limites de seguridad y escalamiento apropiados.
- Se conserva un modo manual y una degradacion segura si la camara o la IA no estan
  disponibles.

## Alcance del MVP

1. Identificar una maquina desde una imagen con confirmacion manual.
2. Registrar fuerza o cardio y guardar una sesion con uno o mas ejercicios.
3. Interpretar descripciones breves para precargar datos estructurados.
4. Solicitar una recomendacion general para la maquina confirmada.
5. Atender menciones de dolor sin diagnosticar y mostrando senales de alarma.
6. Consultar el resumen de la sesion actual y el historial basico.

## Fuera de alcance inicial

- Diagnosticar lesiones, prescribir rehabilitacion o reemplazar a un profesional.
- Estimar automaticamente el peso levantado a partir de una imagen.
- Contar repeticiones continuamente mediante video o sensores.
- Crear rutinas clinicas o planes de entrenamiento totalmente autonomos.
- Publicar rankings, funciones sociales o competencias.
- Garantizar la identificacion de todos los modelos comerciales de maquinas.

## Impacto

### Frontend

- Nueva entrada "Entrenamiento" y flujo de captura/seleccion de imagen.
- Hoja inferior o modal de confirmacion y registro contextual.
- Temporizador de descanso opcional, edicion de series y resumen de sesion.
- Estados de permisos, carga, baja confianza, error de IA y modo manual.

### Backend

- Nuevo modulo de entrenamientos, separado de comidas y recomendaciones nutricionales.
- Persistencia de sesiones, ejercicios, series, metricas de cardio e imagen analizada.
- Endpoints autenticados y contratos OpenAPI para analisis, registro y recomendaciones.

### IA

- Salida estructurada y validada para clasificacion de maquina y extraccion de datos.
- Recomendaciones con contexto limitado al usuario autenticado.
- Respuesta de seguridad determinista antes de cualquier texto generativo sobre dolor.

### Datos y privacidad

- Las imagenes son privadas por defecto y pertenecen al usuario autenticado.
- Se define una politica de retencion; el usuario puede eliminar imagen y registro.
- No se usa contenido del usuario para entrenar modelos sin consentimiento explicito.

## Riesgos

- **Identificacion incorrecta:** exigir confirmacion y ofrecer busqueda/entrada manual.
- **Consejo inseguro:** aplicar reglas de seguridad, lenguaje no clinico y escalamiento.
- **Friccion durante el entrenamiento:** permitir guardar rapido y completar despues.
- **Sobreconfianza en la IA:** mostrar incertidumbre y nunca inferir cargas o lesiones.
- **Costo/latencia:** comprimir imagenes, limitar reintentos y cachear catalogo estatico.

## Criterio de exito

- Una persona puede pasar de foto a primer registro de serie en menos de un minuto.
- Ninguna prediccion de baja confianza se guarda como identificacion confirmada sin una
  accion explicita del usuario.
- Los datos interpretados desde texto siempre se pueden revisar antes de guardarse.
- Toda mencion de dolor activa el flujo de seguridad y no produce un diagnostico.

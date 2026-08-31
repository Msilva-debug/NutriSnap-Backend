# Tareas de implementacion

## 1. Contrato y fundamentos

- [ ] 1.1 Resolver las preguntas abiertas de plataforma, retencion y pais inicial.
- [ ] 1.2 Definir catalogo inicial de maquinas, modalidades, unidades y grupos musculares.
- [ ] 1.3 Crear DTO de request/response y documentarlos completamente en OpenAPI.
- [ ] 1.4 Definir esquema de errores, idempotencia, limites de archivos y rate limiting.
- [ ] 1.5 Agregar pruebas de contrato y deteccion de cambios incompatibles.

## 2. Datos y backend

- [ ] 2.1 Crear entidades y migraciones de sesiones, ejercicios, series y cardio.
- [ ] 2.2 Implementar `WorkoutModule` con autorizacion por propietario en cada recurso.
- [ ] 2.3 Implementar creacion, edicion, finalizacion e historial de sesiones.
- [ ] 2.4 Implementar registro de fuerza y cardio con validaciones de dominio.
- [ ] 2.5 Implementar borrado de imagen y datos asociados conforme a retencion.
- [ ] 2.6 Probar aislamiento entre usuarios, idempotencia y concurrencia de ediciones.

## 3. Imagen e IA

- [ ] 3.1 Implementar carga segura, validacion MIME/tamano y eliminacion de EXIF.
- [ ] 3.2 Crear interfaz de reconocimiento independiente del proveedor de IA.
- [ ] 3.3 Validar la salida estructurada y aplicar umbral de baja confianza.
- [ ] 3.4 Implementar parser de descripcion con unidades explicitas o desconocidas.
- [ ] 3.5 Crear conjunto de evaluacion con maquinas soportadas, ambiguas y no relacionadas.
- [ ] 3.6 Verificar que fallos, timeouts y respuestas invalidas degradan a modo manual.

## 4. Recomendaciones y seguridad

- [ ] 4.1 Definir perfiles principiante/intermedio/avanzado y objetivos soportados.
- [ ] 4.2 Implementar recomendaciones limitadas a maquina, nivel, objetivo e historial.
- [ ] 4.3 Implementar `PainSafetyService` con reglas previas a la respuesta generativa.
- [ ] 4.4 Revisar contenido estatico y prompts con profesionales competentes antes de lanzar.
- [ ] 4.5 Crear evaluaciones de senales de alarma, ambiguedad y resistencia a instrucciones.
- [ ] 4.6 Confirmar que ninguna salida diagnostica, prescribe medicacion o garantiza seguridad.

## 5. Frontend

- [ ] 5.1 Generar cliente/tipos TypeScript desde el contrato OpenAPI versionado.
- [ ] 5.2 Crear entrada de entrenamiento y flujo foto/archivo/busqueda manual.
- [ ] 5.3 Implementar bottom sheet de candidatos, confianza y confirmacion explicita.
- [ ] 5.4 Implementar registro rapido serie por serie y temporizador opcional.
- [ ] 5.5 Implementar formulario de cardio adaptado a caminadora y otras maquinas.
- [ ] 5.6 Implementar descripcion por texto/voz con revision previa al guardado.
- [ ] 5.7 Implementar recomendacion contextual y flujo visible de seguridad por dolor.
- [ ] 5.8 Cubrir accesibilidad, teclado, lectores de pantalla y uso con una mano.
- [ ] 5.9 Implementar estados sin permiso, offline, baja confianza y error de IA.

## 6. Calidad y lanzamiento

- [ ] 6.1 Agregar pruebas unitarias, integracion y e2e para cada escenario normativo.
- [ ] 6.2 Ejecutar pruebas de seguridad de archivos, autorizacion, prompt injection y PII.
- [ ] 6.3 Instrumentar latencia, correcciones, abandono, costo y eventos de seguridad.
- [ ] 6.4 Lanzar con feature flag a usuarios internos y revisar resultados.
- [ ] 6.5 Documentar operacion, rollback, retencion y respuesta ante incidentes.
- [ ] 6.6 Aprobar metricas y revision de seguridad antes de ampliar disponibilidad.

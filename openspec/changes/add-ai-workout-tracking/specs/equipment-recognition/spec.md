## ADDED Requirements

### Requirement: Captura con alternativa manual

The frontend SHALL allow an authenticated user to photograph a gym machine, select an
existing image, or skip image recognition and choose an exercise manually.

#### Scenario: Permiso de camara concedido

- **GIVEN** an authenticated user starts a workout
- **WHEN** the user grants camera permission and takes a photo
- **THEN** the frontend submits the image for analysis and shows cancelable progress

#### Scenario: Permiso de camara rechazado

- **GIVEN** the user does not grant camera permission
- **WHEN** the capture flow cannot open the camera
- **THEN** the frontend offers file selection and manual search without blocking the workout

### Requirement: Identificacion confirmada por el usuario

The system SHALL treat equipment recognition as an unconfirmed suggestion until the
user explicitly confirms or corrects it.

#### Scenario: Resultado de confianza alta

- **GIVEN** the analysis returns a candidate with confidence at or above 0.75
- **WHEN** the candidate is displayed
- **THEN** the frontend shows its name, modality and confidence and requests confirmation

#### Scenario: Resultado de confianza baja

- **GIVEN** the highest candidate confidence is below 0.75
- **WHEN** analysis completes
- **THEN** the frontend presents candidates without asserting a definitive identification
- **AND** provides a visible manual-search option

#### Scenario: Ninguna maquina reconocida

- **GIVEN** the image is unrelated, unusable or outside the supported catalog
- **WHEN** the system cannot produce a valid candidate
- **THEN** no inferred equipment is saved
- **AND** the user can retry or continue manually

### Requirement: Fallo seguro de la IA

The system SHALL validate AI output against a structured schema and SHALL NOT persist
partial inferences when the output is invalid or the provider fails.

#### Scenario: Respuesta invalida del proveedor

- **GIVEN** the AI provider returns malformed or incomplete data
- **WHEN** the backend validates the response
- **THEN** it records a sanitized failure metric
- **AND** returns a recoverable error that enables manual entry

### Requirement: Privacidad de imagenes

The system SHALL restrict every workout image and analysis to its authenticated owner
and SHALL support deletion according to the configured retention policy.

#### Scenario: Acceso por otro usuario

- **GIVEN** an image belongs to user A
- **WHEN** user B requests the image or its analysis
- **THEN** the API denies access without disclosing private metadata

#### Scenario: Eliminacion solicitada

- **GIVEN** the user owns a stored workout image
- **WHEN** the user requests its deletion
- **THEN** the system deletes or schedules deletion of the image and exposes the outcome

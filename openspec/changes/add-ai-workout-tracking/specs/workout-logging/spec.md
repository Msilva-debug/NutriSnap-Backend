## ADDED Requirements

### Requirement: Sesiones de entrenamiento autenticadas

The system SHALL allow an authenticated user to start, resume and finish a workout
session, and SHALL isolate all session data by owner.

#### Scenario: Iniciar y finalizar sesion

- **GIVEN** an authenticated user
- **WHEN** the user starts a session, records an exercise and finishes it
- **THEN** the API returns a summary containing the exercise and completion time

#### Scenario: Recurso de otro usuario

- **GIVEN** a workout belongs to another user
- **WHEN** the current user attempts to read or modify it
- **THEN** the API rejects the operation without exposing the workout contents

### Requirement: Registro guiado de fuerza

The frontend SHALL support planned sets and record each completed strength set with
repetitions plus optional load, rest and perceived-effort values.

#### Scenario: Tres series planeadas

- **GIVEN** the user states "hare 3 series"
- **WHEN** the user confirms the plan
- **THEN** the UI prepares three editable set rows
- **AND** prompts for completed repetitions after each set

#### Scenario: Serie diferente al plan

- **GIVEN** a user planned a repetition target
- **WHEN** the completed repetitions differ from the target
- **THEN** the actual value can be saved without overwriting or fabricating results

#### Scenario: Usuario avanzado

- **GIVEN** the user enabled advanced fields
- **WHEN** a strength set is recorded
- **THEN** the user can optionally enter RPE or RIR, warm-up status and rest duration

### Requirement: Registro contextual de cardio

The frontend SHALL present metrics appropriate to the confirmed cardio equipment and
SHALL preserve unknown units rather than guessing them.

#### Scenario: Descripcion de caminadora

- **GIVEN** the confirmed equipment is a treadmill
- **WHEN** the user enters "hice 30 minutos a 5.0 con una inclinacion de 5"
- **THEN** the system proposes duration 30 minutes, speed 5.0 and incline 5 for review
- **AND** requests a speed unit if no preference establishes one

#### Scenario: Correccion antes de guardar

- **GIVEN** structured values were extracted from free text
- **WHEN** the user reviews the proposal
- **THEN** every proposed value is editable and requires confirmation before persistence

### Requirement: Operacion resiliente

The frontend SHALL preserve an in-progress workout during transient connectivity loss
and SHALL avoid duplicate sets when synchronization is retried.

#### Scenario: Perdida temporal de red

- **GIVEN** the user completes a set while offline
- **WHEN** connectivity returns
- **THEN** the draft synchronizes using an idempotent mutation
- **AND** only one completed set is stored

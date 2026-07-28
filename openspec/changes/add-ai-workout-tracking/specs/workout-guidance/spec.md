## ADDED Requirements

### Requirement: Recomendaciones adaptadas al nivel

The system SHALL allow users to request general guidance for confirmed equipment and
SHALL adapt terminology and detail to their declared experience level and goal.

#### Scenario: Persona principiante

- **GIVEN** a beginner confirms a chest press machine
- **WHEN** the user requests guidance
- **THEN** the response prioritizes setup, general technique, conservative progression
  and a simple starting approach

#### Scenario: Persona avanzada

- **GIVEN** an advanced user confirms a machine and training goal
- **WHEN** the user requests guidance
- **THEN** the response may use advanced concepts such as RPE, RIR, volume and rest
- **AND** explains assumptions rather than presenting generic advice as a prescription

#### Scenario: Maquina sin confirmar

- **GIVEN** equipment recognition has not been confirmed
- **WHEN** the user requests machine-specific guidance
- **THEN** the system requests confirmation or manual selection before responding

### Requirement: Deteccion prioritaria de dolor

The system SHALL route any message that mentions pain or possible injury through a
safety assessment before generating workout guidance.

#### Scenario: Dolor de hombro durante press

- **GIVEN** the user says "es una maquina de pecho pero me esta doliendo el hombro"
- **WHEN** the message is submitted
- **THEN** the system advises stopping the painful movement and not training through pain
- **AND** asks only safety-relevant follow-up questions
- **AND** recommends professional evaluation if pain persists, recurs or is concerning

#### Scenario: Senal de emergencia

- **GIVEN** the message includes chest pain, severe breathing difficulty, fainting or
  another configured emergency sign
- **WHEN** the safety assessment runs
- **THEN** the system prominently advises stopping and seeking local emergency help now
- **AND** does not continue with performance or progression recommendations

#### Scenario: Senal de lesion importante

- **GIVEN** the user reports sudden severe pain, deformity, loss of sensation or strength,
  or inability to move or bear weight
- **WHEN** the safety assessment runs
- **THEN** the system recommends stopping and obtaining prompt professional assessment

### Requirement: Limites no clinicos

The system SHALL present pain guidance as general safety information and SHALL NOT
diagnose an injury, prescribe medication, or guarantee that continuing is safe.

#### Scenario: Solicitud de diagnostico

- **GIVEN** the user asks the assistant to diagnose shoulder pain from a photo or text
- **WHEN** the assistant responds
- **THEN** it clearly states the limitation
- **AND** provides appropriate escalation guidance without naming a definitive condition

### Requirement: Recomendaciones disponibles sin IA generativa

The system SHALL provide reviewed static safety guidance when the generative provider
is unavailable and SHALL NOT improvise unvalidated medical guidance.

#### Scenario: Proveedor no disponible durante consulta de dolor

- **GIVEN** the safety rules detect a pain-related message
- **AND** the generative provider times out
- **WHEN** the response is built
- **THEN** the user receives the deterministic stop/escalation guidance for that level

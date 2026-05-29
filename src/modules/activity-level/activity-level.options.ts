import {
  ActivityLevel,
  ActivityLevelValue,
} from './entities/activity-level.entity';

export const activityLevelOptions: ActivityLevel[] = [
  {
    value: ActivityLevelValue.SEDENTARY,
    label: 'Sedentario',
    description: 'poco o nada de ejercicio',
  },
  {
    value: ActivityLevelValue.LIGHT,
    label: 'Ligero',
    description: '1-3 dias/semana',
  },
  {
    value: ActivityLevelValue.MODERATE,
    label: 'Moderado',
    description: '3-5 dias/semana',
  },
  {
    value: ActivityLevelValue.ACTIVE,
    label: 'Activo',
    description: '6-7 dias/semana',
  },
  {
    value: ActivityLevelValue.VERY_ACTIVE,
    label: 'Muy activo',
    description: 'ejercicio intenso diario',
  },
];

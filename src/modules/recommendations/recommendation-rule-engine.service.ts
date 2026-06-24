import { Injectable } from '@nestjs/common';
import { MealType } from '../meal/entities/meal.entity';
import {
  Recommendation,
  RecommendationAnalysisInput,
  RecommendationsResponse,
} from './recommendation.types';

interface MacroTotals {
  calories: number;
  carbs: number;
  fats: number;
  proteins: number;
}

@Injectable()
export class RecommendationRuleEngine {
  build(input: RecommendationAnalysisInput): RecommendationsResponse {
    const totals = this.calculateTotals(input.meals);
    const recommendations = this.buildRecommendations(input, totals);

    return {
      period: input.period,
      summary: this.buildSummary(input, totals),
      recommendations,
    };
  }

  private buildRecommendations(
    input: RecommendationAnalysisInput,
    totals: MacroTotals,
  ): Recommendation[] {
    if (!input.meals.length) {
      return [
        {
          category: 'Base alimenticia',
          title: 'Construye una comida simple y completa',
          description:
            'Si no tienes una comida clara para este periodo, arma un plato con proteina, carbohidrato moderado y verduras, por ejemplo huevos con arepa pequena y fruta.',
        },
      ];
    }

    const recommendations: Recommendation[] = [];
    const daysWithMeals = new Set(input.meals.map((meal) => meal.date)).size;
    const mealTypeCount = this.countMealTypes(input.meals);
    const macroCalories =
      totals.proteins * 4 + totals.carbs * 4 + totals.fats * 9;
    const averageCaloriesByDay = Math.round(totals.calories / input.totalDays);
    const averageCaloriesByMeal = Math.round(
      totals.calories / input.meals.length,
    );

    if (daysWithMeals < input.totalDays) {
      recommendations.push({
        category: 'Consistencia alimentaria',
        title: 'Ten opciones base para dias ocupados',
        description:
          'Para evitar saltarte comidas o improvisar, deja listas opciones faciles como huevos cocidos, atun, yogur griego, fruta o frutos secos medidos.',
      });
    } else {
      recommendations.push({
        category: 'Variedad',
        title: 'Mantén variedad durante la semana',
        description:
          'Tu periodo tiene suficiente informacion para mejorar el patron: alterna proteinas, carbohidratos y verduras para no depender siempre del mismo plato.',
      });
    }

    if (macroCalories > 0) {
      const proteinShare = (totals.proteins * 4) / macroCalories;
      const carbsShare = (totals.carbs * 4) / macroCalories;
      const fatsShare = (totals.fats * 9) / macroCalories;

      if (proteinShare < 0.2) {
        recommendations.push({
          category: 'Proteinas',
          title: 'Refuerza tu consumo de proteina',
          description:
            'Tus registros muestran poca proteina frente al resto de macros. Cambia una parte del arroz o harina por pollo, huevos, atun, lentejas, frijoles o tofu.',
        });
      }

      if (carbsShare > 0.55) {
        recommendations.push({
          category: 'Carbohidratos',
          title: 'Acompana mejor tus carbohidratos',
          description:
            'Si predomina el arroz o las harinas, reduce una parte y completa el plato con proteina y verduras salteadas, ensalada o legumbres.',
        });
      }

      if (fatsShare > 0.35) {
        recommendations.push({
          category: 'Grasas',
          title: 'Modera las grasas del periodo',
          description:
            'Si usas mucho aceite, fritos, salsas o aguacate, baja la porcion y prioriza preparaciones asadas, cocidas o al vapor.',
        });
      }
    }

    if (Object.keys(mealTypeCount).length <= 1 && input.meals.length > 1) {
      recommendations.push({
        category: 'Energia',
        title: 'Agrega snacks con intención',
        description:
          'Si concentras energia en una comida, reparte mejor el dia con snacks como yogur griego con fruta, huevos cocidos o hummus con verduras.',
      });
    } else if (averageCaloriesByMeal > 800) {
      recommendations.push({
        category: 'Energia',
        title: 'Revisa el tamano de tus comidas',
        description:
          'El promedio de calorias por comida es alto. Baja un poco la porcion principal y suma volumen con ensalada, frutas enteras o verduras cocidas.',
      });
    }

    if (averageCaloriesByDay > 2800) {
      recommendations.push({
        category: 'Calorias',
        title: 'Evalua tu consumo energetico',
        description:
          'El promedio diario de calorias es elevado. Cambia parte de comidas muy densas por proteinas magras, verduras y carbohidratos medidos.',
      });
    }

    return recommendations.slice(0, 5);
  }

  private buildSummary(
    input: RecommendationAnalysisInput,
    totals: MacroTotals,
  ): string {
    const noteText = input.notes.length
      ? ` Las notas registradas aportan contexto sobre habitos y sensaciones del periodo.`
      : ' Hay poco contexto escrito, asi que el analisis se basa principalmente en los registros de comidas.';

    if (!input.meals.length) {
      return `No encontramos comidas registradas en el periodo seleccionado.${noteText}`;
    }

    const macroText = [
      totals.proteins > 0 ? `${totals.proteins}g de proteina` : '',
      totals.carbs > 0 ? `${totals.carbs}g de carbohidratos` : '',
      totals.fats > 0 ? `${totals.fats}g de grasas` : '',
    ]
      .filter(Boolean)
      .join(', ');

    return `El periodo muestra ${input.meals.length} comidas registradas y una ingesta aproximada de ${totals.calories} calorias${
      macroText ? `, con ${macroText}` : ''
    }.${noteText}`;
  }

  private calculateTotals(
    meals: RecommendationAnalysisInput['meals'],
  ): MacroTotals {
    return meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + Number(meal.calories ?? 0),
        proteins: totals.proteins + Number(meal.proteins ?? 0),
        carbs: totals.carbs + Number(meal.carbs ?? 0),
        fats: totals.fats + Number(meal.fats ?? 0),
      }),
      {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
      },
    );
  }

  private countMealTypes(
    meals: RecommendationAnalysisInput['meals'],
  ): Partial<Record<MealType, number>> {
    return meals.reduce<Partial<Record<MealType, number>>>((counts, meal) => {
      counts[meal.type] = (counts[meal.type] ?? 0) + 1;

      return counts;
    }, {});
  }
}

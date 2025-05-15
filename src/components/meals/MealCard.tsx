import React, { useState } from 'react';
import { MoreVertical, Clock, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Meal {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  emoji?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time: number;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  user_id: string;
  created_at?: string;
}

interface MealCardProps {
  meal: Meal;
  onAddToMealPlan: (meal: Meal, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  selectedDate: Date;
}

const MealCard: React.FC<MealCardProps> = ({ meal, onAddToMealPlan, selectedDate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="relative h-48 w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-nuumi-pink/10 to-nuumi-pink/30">
        <div className="text-8xl">{meal.emoji || '🍽️'}</div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{meal.name}</h3>
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAddToMealPlan(meal, 'breakfast')}>
                  Add to Breakfast
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddToMealPlan(meal, 'lunch')}>
                  Add to Lunch
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddToMealPlan(meal, 'dinner')}>
                  Add to Dinner
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddToMealPlan(meal, 'snack')}>
                  Add as Snack
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{meal.description}</p>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>{meal.prep_time} min</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {meal.calories} kcal
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {meal.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center justify-center p-2 bg-secondary rounded-lg">
            <span className="text-xs text-muted-foreground">Protein</span>
            <span className="font-semibold">{meal.protein}g</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 bg-secondary rounded-lg">
            <span className="text-xs text-muted-foreground">Carbs</span>
            <span className="font-semibold">{meal.carbs}g</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 bg-secondary rounded-lg">
            <span className="text-xs text-muted-foreground">Fat</span>
            <span className="font-semibold">{meal.fat}g</span>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full flex items-center justify-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="mr-2">{isExpanded ? 'Show Less' : 'Show More'}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
        </Button>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-medium mb-2">Ingredients</h4>
              <ul className="list-disc pl-5 space-y-1">
                {meal.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-sm">{ingredient}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Instructions</h4>
              <ol className="list-decimal pl-5 space-y-1">
                {meal.instructions.map((instruction, index) => (
                  <li key={index} className="text-sm">{instruction}</li>
                ))}
              </ol>
            </div>

            {meal.created_at && (
              <p className="text-xs text-muted-foreground">
                Added {formatDate(meal.created_at)}
              </p>
            )}
          </div>
        )}

        <Button
          className="w-full mt-4 bg-nuumi-pink hover:bg-nuumi-pink/90 text-white"
          onClick={() => onAddToMealPlan(meal, 'lunch')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add to Today's Plan
        </Button>
      </div>
    </div>
  );
};

export default MealCard;

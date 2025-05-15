import React, { useState } from 'react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Meal {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time: number;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  user_id: string;
}

interface MealPlan {
  id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_id: string;
  user_id: string;
  meal?: Meal;
}

interface MealPlanCalendarProps {
  mealPlans: MealPlan[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAddMeal: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}

const MealPlanCalendar: React.FC<MealPlanCalendarProps> = ({
  mealPlans,
  selectedDate,
  onDateChange,
  onAddMeal,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);

  // Generate week days
  const generateWeekDays = () => {
    const days = [];
    const startOfWeek = addDays(new Date(), weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const day = addDays(startOfWeek, i);
      days.push(day);
    }

    return days;
  };

  const weekDays = generateWeekDays();

  const handlePreviousWeek = () => {
    setWeekOffset(weekOffset - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(weekOffset + 1);
  };

  const handleDayClick = (day: Date) => {
    onDateChange(day);
  };

  // Filter meal plans for selected date
  const getPlansForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return mealPlans.filter(plan => plan.date === dateString);
  };

  const selectedDatePlans = getPlansForDate(selectedDate);

  // Get meal plan by type
  const getMealByType = (type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    return selectedDatePlans.find(plan => plan.meal_type === type);
  };

  const breakfastPlan = getMealByType('breakfast');
  const lunchPlan = getMealByType('lunch');
  const dinnerPlan = getMealByType('dinner');
  const snackPlan = getMealByType('snack');

  return (
    <div className="space-y-6">
      {/* Calendar navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-medium">
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </h3>
        <Button variant="outline" size="icon" onClick={handleNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {weekDays.map((day, index) => (
          <Button
            key={index}
            variant="ghost"
            className={cn(
              "flex flex-col items-center p-2 h-auto",
              isSameDay(day, selectedDate) && "bg-nuumi-pink/10 text-nuumi-pink"
            )}
            onClick={() => handleDayClick(day)}
          >
            <span className="text-xs">{format(day, 'EEE')}</span>
            <span className={cn(
              "text-lg font-semibold",
              isSameDay(day, selectedDate) && "text-nuumi-pink"
            )}>
              {format(day, 'd')}
            </span>
          </Button>
        ))}
      </div>

      {/* Selected date */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <p className="text-sm text-muted-foreground">
          Your meal plan for today
        </p>
      </div>

      {/* Meal plan for selected date */}
      <div className="space-y-4">
        {/* Breakfast */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Breakfast</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onAddMeal('breakfast')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>

          {breakfastPlan ? (
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-md overflow-hidden flex items-center justify-center bg-gradient-to-br from-nuumi-pink/10 to-nuumi-pink/30">
                <div className="text-4xl">{breakfastPlan.meal?.emoji || '🍽️'}</div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{breakfastPlan.meal?.name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{breakfastPlan.meal?.calories} kcal</span>
                  <span>•</span>
                  <span>{breakfastPlan.meal?.prep_time} min</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-16 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">No breakfast planned</p>
            </div>
          )}
        </div>

        {/* Lunch */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Lunch</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onAddMeal('lunch')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>

          {lunchPlan ? (
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-md overflow-hidden flex items-center justify-center bg-gradient-to-br from-nuumi-pink/10 to-nuumi-pink/30">
                <div className="text-4xl">{lunchPlan.meal?.emoji || '🍽️'}</div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{lunchPlan.meal?.name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{lunchPlan.meal?.calories} kcal</span>
                  <span>•</span>
                  <span>{lunchPlan.meal?.prep_time} min</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-16 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">No lunch planned</p>
            </div>
          )}
        </div>

        {/* Dinner */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Dinner</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onAddMeal('dinner')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>

          {dinnerPlan ? (
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-md overflow-hidden flex items-center justify-center bg-gradient-to-br from-nuumi-pink/10 to-nuumi-pink/30">
                <div className="text-4xl">{dinnerPlan.meal?.emoji || '🍽️'}</div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{dinnerPlan.meal?.name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{dinnerPlan.meal?.calories} kcal</span>
                  <span>•</span>
                  <span>{dinnerPlan.meal?.prep_time} min</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-16 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">No dinner planned</p>
            </div>
          )}
        </div>

        {/* Snack */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Snack</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onAddMeal('snack')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>

          {snackPlan ? (
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-md overflow-hidden flex items-center justify-center bg-gradient-to-br from-nuumi-pink/10 to-nuumi-pink/30">
                <div className="text-4xl">{snackPlan.meal?.emoji || '🍽️'}</div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{snackPlan.meal?.name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{snackPlan.meal?.calories} kcal</span>
                  <span>•</span>
                  <span>{snackPlan.meal?.prep_time} min</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-16 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">No snack planned</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealPlanCalendar;

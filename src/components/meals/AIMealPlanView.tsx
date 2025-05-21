import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ChevronDown, ChevronUp, Clock, Info, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  generateGoogleCalendarUrl,
  downloadICalFile,
  formatMealDescription
} from '@/utils/calendarUtils';

interface MealPlan {
  introduction: string;
  meals: Array<{
    name: string;
    ingredients: string[];
    instructions: string[];
    nutrients: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    benefits: string;
    imageEmoji: string;
  }>;
  tips: string[];
}

interface AIMealPlanViewProps {
  mealPlan: MealPlan;
  onSave: () => void;
  targetUser: 'mother' | 'child';
  mealType: string;
}

const SimpleMealCard = ({ meal, index }) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="mr-2">{meal.imageEmoji || '🍽️'}</span>
          <span>{meal.name || 'Meal'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Ingredients</h4>
            <ul className="text-sm space-y-1">
              {Array.isArray(meal.ingredients) && meal.ingredients.map((ingredient, i) => (
                <li key={i} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Instructions</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              {Array.isArray(meal.instructions) && meal.instructions.map((instruction, i) => (
                <li key={i} className="pl-1">{instruction}</li>
              ))}
            </ol>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Nutrition Information</h4>
            <div className="flex flex-wrap gap-2">
              {meal.nutrients && (
                <>
                  <Badge variant="outline">Calories: {meal.nutrients.calories || 0}</Badge>
                  <Badge variant="outline">Protein: {meal.nutrients.protein || 0}g</Badge>
                  <Badge variant="outline">Carbs: {meal.nutrients.carbs || 0}g</Badge>
                  <Badge variant="outline">Fat: {meal.nutrients.fat || 0}g</Badge>
                </>
              )}
            </div>
          </div>

          {meal.benefits && (
            <div>
              <h4 className="text-sm font-medium mb-2">Benefits</h4>
              <p className="text-sm text-muted-foreground">{meal.benefits}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AIMealPlanView: React.FC<AIMealPlanViewProps> = ({
  mealPlan,
  onSave,
  targetUser,
  mealType
}) => {
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to ensure we're rendering on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add error handling for mealPlan
  if (!isClient) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Loading meal plan...</p>
      </div>
    );
  }

  if (!mealPlan) {
    console.error('Meal plan is undefined or null');
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error: Invalid meal plan data</p>
        <p className="text-muted-foreground mt-2">Please try generating a new meal plan</p>
      </div>
    );
  }

  if (!mealPlan.meals || !Array.isArray(mealPlan.meals) || mealPlan.meals.length === 0) {
    console.error('Meal plan has no meals or invalid meals array:', mealPlan);
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error: No meals found in the meal plan</p>
        <p className="text-muted-foreground mt-2">Please try generating a new meal plan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Dialog */}
      <Dialog>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Calendar</DialogTitle>
            <DialogDescription>
              Schedule this meal in your calendar
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meal-date">Date</Label>
              <Input
                id="meal-date"
                type="date"
                value={calendarDate}
                onChange={(e) => setCalendarDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="meal-time">Time</Label>
              <Input
                id="meal-time"
                type="time"
                value={calendarTime}
                onChange={(e) => setCalendarTime(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="meal-duration">Duration (minutes)</Label>
              <Input
                id="meal-duration"
                type="number"
                min="15"
                step="15"
                value={calendarDuration}
                onChange={(e) => setCalendarDuration(parseInt(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => generateCalendarEvent('ical')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download iCal
            </Button>
            <Button
              type="button"
              onClick={() => generateCalendarEvent('google')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Add to Google Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Your AI Meal Plan</CardTitle>
              <CardDescription>
                For {targetUser === 'mother' ? 'Mother' : 'Child'} • {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {mealPlan.introduction}
          </p>

          <div className="space-y-4">
            {mealPlan.meals.map((meal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card variant="glass" className="overflow-hidden">
                  <div
                    className="flex items-center p-4 cursor-pointer"
                    onClick={() => toggleMealExpansion(index)}
                  >
                    <div className="h-12 w-12 rounded-md overflow-hidden flex items-center justify-center bg-gradient-to-br from-nuumi-pink/10 to-nuumi-pink/30 mr-3">
                      <div className="text-3xl">{meal.imageEmoji || '🍽️'}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{meal.name}</h3>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{meal.nutrients.calories} kcal</span>
                        <span className="mx-1">•</span>
                        <span>{meal.nutrients.protein}g protein</span>
                      </div>
                    </div>
                    {expandedMealIndex === index ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedMealIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-4 pb-4 space-y-4">
                          <div className="flex justify-end mb-2">
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="calendar-button"
                                onClick={() => handleAddToCalendar(index)}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Add to Calendar
                              </Button>
                            </DialogTrigger>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Ingredients</h4>
                            <ul className="text-sm space-y-1">
                              {meal.ingredients.map((ingredient, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{ingredient}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Instructions</h4>
                            <ol className="text-sm space-y-2">
                              {meal.instructions.map((instruction, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="font-medium mr-2">{i + 1}.</span>
                                  <span>{instruction}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Nutrition Information</h4>
                            <div className="grid grid-cols-4 gap-2 text-sm">
                              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                                <span className="text-xs text-muted-foreground">Calories</span>
                                <span className="font-medium">{meal.nutrients.calories}</span>
                              </div>
                              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                                <span className="text-xs text-muted-foreground">Protein</span>
                                <span className="font-medium">{meal.nutrients.protein}g</span>
                              </div>
                              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                                <span className="text-xs text-muted-foreground">Carbs</span>
                                <span className="font-medium">{meal.nutrients.carbs}g</span>
                              </div>
                              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                                <span className="text-xs text-muted-foreground">Fat</span>
                                <span className="font-medium">{meal.nutrients.fat}g</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Benefits</h4>
                            <p className="text-sm text-muted-foreground">{meal.benefits}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {mealPlan.tips && mealPlan.tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preparation Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mealPlan.tips.map((tip, index) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="mr-2">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIMealPlanView;

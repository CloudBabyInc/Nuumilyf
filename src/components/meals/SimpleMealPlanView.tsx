import React, { useState, useEffect } from 'react';
import { Save, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateMealEmojis, createEmojiBanner } from '@/utils/emojiUtils';
import { toast } from 'sonner';

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
    imageEmoji?: string;
    emojis?: string[]; // Array of emojis for the banner
  }>;
  tips: string[];
}

interface SimpleMealPlanViewProps {
  mealPlan: MealPlan;
  onSave: () => void;
  targetUser: 'mother' | 'child';
  mealType: string;
}

/**
 * A simplified meal plan view component that avoids complex animations and interactions
 * to prevent rendering issues
 */
const SimpleMealPlanView: React.FC<SimpleMealPlanViewProps> = ({
  mealPlan,
  onSave,
  targetUser,
  mealType
}) => {
  const [mealsWithEmojis, setMealsWithEmojis] = useState<Array<any>>([]);

  // Generate emojis for each meal when component mounts
  useEffect(() => {
    if (mealPlan && mealPlan.meals && Array.isArray(mealPlan.meals)) {
      const updatedMeals = mealPlan.meals.map(meal => {
        if (!meal.emojis || meal.emojis.length === 0) {
          const generatedEmojis = generateMealEmojis(
            meal.ingredients,
            meal.name,
            mealType,
            []
          );
          return { ...meal, emojis: generatedEmojis };
        }
        return meal;
      });
      setMealsWithEmojis(updatedMeals);
    }
  }, [mealPlan, mealType]);

  // Share meal plan function
  const handleShareMealPlan = async () => {
    try {
      if (!mealPlan || !mealsWithEmojis.length) return;

      // Create a shareable text
      let shareText = `AI-Generated Meal Plan for ${targetUser === 'mother' ? 'Mother' : 'Child'} (${mealType})\n\n`;
      shareText += `${mealPlan.introduction}\n\n`;

      // Add each meal
      mealsWithEmojis.forEach((meal, index) => {
        shareText += `Meal ${index + 1}: ${meal.name}\n`;
        shareText += `${createEmojiBanner(meal.emojis || [meal.imageEmoji || '🍽️'])}\n\n`;
        shareText += `Ingredients:\n${meal.ingredients.map(i => `- ${i}`).join('\n')}\n\n`;
        shareText += `Instructions:\n${meal.instructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\n`;
        shareText += `Nutrition: ${meal.nutrients.calories} kcal | Protein: ${meal.nutrients.protein}g | Carbs: ${meal.nutrients.carbs}g | Fat: ${meal.nutrients.fat}g\n\n`;
        if (meal.benefits) {
          shareText += `Benefits: ${meal.benefits}\n\n`;
        }
      });

      // Add tips
      if (mealPlan.tips && mealPlan.tips.length > 0) {
        shareText += `Tips:\n${mealPlan.tips.map(tip => `- ${tip}`).join('\n')}\n`;
      }

      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: `AI Meal Plan for ${targetUser} (${mealType})`,
          text: shareText
        });
        toast.success('Meal plan shared successfully!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        toast.success('Meal plan copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing meal plan:', error);
      toast.error('Failed to share meal plan');
    }
  };

  // Error handling for mealPlan
  if (!mealPlan) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error: Invalid meal plan data</p>
        <p className="text-muted-foreground mt-2">Please try generating a new meal plan</p>
      </div>
    );
  }

  if (!mealPlan.meals || !Array.isArray(mealPlan.meals) || mealPlan.meals.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error: No meals found in the meal plan</p>
        <p className="text-muted-foreground mt-2">Please try generating a new meal plan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Your AI Meal Plan</CardTitle>
              <CardDescription>
                For {targetUser === 'mother' ? 'Mother' : 'Child'} • {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareMealPlan}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">{mealPlan.introduction}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Meals</h3>

        {mealsWithEmojis.length > 0 ? (
          mealsWithEmojis.map((meal, index) => (
            <Card key={index} variant="glass" className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <div className="flex items-center gap-1 mr-2">
                    {meal.emojis && meal.emojis.length > 0 ? (
                      meal.emojis.map((emoji: string, emojiIndex: number) => (
                        <motion.span
                          key={emojiIndex}
                          className="text-xl"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{
                            x: 0,
                            opacity: 1
                          }}
                          transition={{
                            duration: 0.5,
                            delay: emojiIndex * 0.1,
                            ease: "easeOut"
                          }}
                        >
                          {emoji}
                        </motion.span>
                      ))
                    ) : (
                      <motion.span
                        className="text-xl"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{
                          x: 0,
                          opacity: 1
                        }}
                        transition={{
                          duration: 0.5,
                          ease: "easeOut"
                        }}
                      >
                        {meal.emojis?.[0] || '🍽️'}
                      </motion.span>
                    )}
                  </div>
                  <span>{meal.name}</span>
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
          ))
        ) : (
          mealPlan.meals.map((meal, index) => (
            <Card key={index} className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <span className="mr-2 text-xl">{meal.imageEmoji || '🍽️'}</span>
                  <span>{meal.name}</span>
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
          ))
        )}
      </div>

      {mealPlan.tips && mealPlan.tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mealPlan.tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimpleMealPlanView;
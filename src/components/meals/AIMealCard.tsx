import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Info, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { generateMealEmojis, createEmojiBanner } from '@/utils/emojiUtils';
import { toast } from 'sonner';

interface Meal {
  name: string;
  description: string;
  nutritionalBenefits?: string;
  suitabilityReason?: string;
  imageEmoji?: string;
  emojis?: string[]; // Array of emojis for the banner
  ingredients?: string[];
  instructions?: string[];
  nutrients?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  benefits?: string;
}

interface AIMealCardProps {
  meal: Meal;
  onSelect: () => void;
}

const AIMealCard: React.FC<AIMealCardProps> = ({ meal, onSelect }) => {
  const [mealEmojis, setMealEmojis] = useState<string[]>([]);

  // Generate emojis based on ingredients when component mounts
  useEffect(() => {
    if (!meal.emojis || meal.emojis.length === 0) {
      // For AI meals, we might not have tags, so we'll infer from the name and ingredients
      const generatedEmojis = generateMealEmojis(
        meal.ingredients || [],
        meal.name,
        undefined,
        []
      );

      setMealEmojis(generatedEmojis);
    } else {
      setMealEmojis(meal.emojis);
    }
  }, [meal]);

  // Share meal function
  const handleShareMeal = async () => {
    try {
      // Create a shareable text
      const shareText = `Check out this AI-generated meal: ${meal.name}\n\n` +
        `${createEmojiBanner(mealEmojis)}\n\n` +
        `Description: ${meal.description || meal.benefits || ''}\n\n` +
        (meal.ingredients ? `Ingredients:\n${meal.ingredients.map(i => `- ${i}`).join('\n')}\n\n` : '') +
        (meal.instructions ? `Instructions:\n${meal.instructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\n` : '') +
        (meal.nutrients ? `Nutrition: ${meal.nutrients.calories} kcal | Protein: ${meal.nutrients.protein}g | Carbs: ${meal.nutrients.carbs}g | Fat: ${meal.nutrients.fat}g` : '');

      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: meal.name,
          text: shareText
        });
        toast.success('Meal shared successfully!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        toast.success('Meal details copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing meal:', error);
      toast.error('Failed to share meal');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="glass" className="overflow-hidden">
        <div className="relative h-24 w-full overflow-hidden flex flex-wrap items-center justify-center bg-gradient-to-br from-nuumi-pink/10 to-nuumi-pink/30">
          {mealEmojis.length > 0 ? (
            <div className="flex flex-wrap justify-center items-center gap-2 p-2 text-center">
              {mealEmojis.map((emoji, index) => (
                <motion.span
                  key={index}
                  className="text-4xl"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{
                    x: 0,
                    opacity: 1
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
          ) : (
            <motion.div
              className="text-6xl"
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
            </motion.div>
          )}
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{meal.name}</CardTitle>
          <CardDescription className="line-clamp-2">{meal.description}</CardDescription>
        </CardHeader>

        <CardContent className="pb-2">
          {meal.nutrients && (
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>{meal.nutrients.calories} kcal</span>
              <span>{meal.nutrients.protein}g protein</span>
              <span>{meal.nutrients.carbs}g carbs</span>
              <span>{meal.nutrients.fat}g fat</span>
            </div>
          )}

          {(meal.nutritionalBenefits || meal.benefits) && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full flex items-center justify-center text-xs">
                  <Info className="h-3 w-3 mr-1" />
                  Nutritional Benefits
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{meal.name}</DialogTitle>
                  <DialogDescription>Nutritional Information</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Benefits</h4>
                    <p className="text-sm text-muted-foreground">
                      {meal.nutritionalBenefits || meal.benefits}
                    </p>
                  </div>

                  {meal.suitabilityReason && (
                    <div>
                      <h4 className="font-medium mb-1">Why It's Suitable</h4>
                      <p className="text-sm text-muted-foreground">
                        {meal.suitabilityReason}
                      </p>
                    </div>
                  )}

                  {meal.nutrients && (
                    <div>
                      <h4 className="font-medium mb-1">Nutrition Facts</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Calories: {meal.nutrients.calories} kcal</div>
                        <div>Protein: {meal.nutrients.protein}g</div>
                        <div>Carbs: {meal.nutrients.carbs}g</div>
                        <div>Fat: {meal.nutrients.fat}g</div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>

        <CardFooter>
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              onClick={onSelect}
              className="bg-nuumi-pink hover:bg-nuumi-pink/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Select
            </Button>
            <Button
              variant="outline"
              onClick={handleShareMeal}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default AIMealCard;

import React, { useState, useEffect } from 'react';
import { MoreVertical, Clock, Plus, ChevronDown, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { generateMealEmojis, createEmojiBanner } from '@/utils/emojiUtils';
import { toast } from 'sonner';

interface Meal {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  emoji?: string;
  emojis?: string[]; // Array of emojis for the banner
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
  const [mealEmojis, setMealEmojis] = useState<string[]>([]);

  // Generate emojis based on ingredients when component mounts
  useEffect(() => {
    if (!meal.emojis || meal.emojis.length === 0) {
      // Extract meal type from tags if available
      const mealType = meal.tags.find(tag =>
        ['breakfast', 'lunch', 'dinner', 'snack', 'baby', 'mother'].includes(tag.toLowerCase())
      );

      const generatedEmojis = generateMealEmojis(
        meal.ingredients,
        meal.name,
        mealType,
        meal.tags
      );

      setMealEmojis(generatedEmojis);
    } else {
      setMealEmojis(meal.emojis);
    }
  }, [meal]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Share meal function
  const handleShareMeal = async () => {
    try {
      // Create a shareable text
      const shareText = `Check out this delicious meal: ${meal.name}\n\n` +
        `${createEmojiBanner(mealEmojis)}\n\n` +
        `Description: ${meal.description}\n\n` +
        `Ingredients:\n${meal.ingredients.map(i => `- ${i}`).join('\n')}\n\n` +
        `Instructions:\n${meal.instructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\n` +
        `Nutrition: ${meal.calories} kcal | Protein: ${meal.protein}g | Carbs: ${meal.carbs}g | Fat: ${meal.fat}g`;

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
    <div className="rounded-lg border glass-intense text-card-foreground shadow-sm overflow-hidden">
      <div className="relative h-48 w-full overflow-hidden flex flex-wrap items-center justify-center bg-gradient-to-br from-nuumi-pink/10 to-nuumi-pink/30">
        {mealEmojis.length > 0 ? (
          <div className="flex flex-wrap justify-center items-center gap-2 p-4 text-center">
            {mealEmojis.map((emoji, index) => (
              <motion.span
                key={index}
                className="text-6xl"
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
            className="text-8xl"
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
            {meal.emoji || '🍽️'}
          </motion.div>
        )}
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
                <DropdownMenuItem onClick={handleShareMeal}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Meal
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

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button
            className="bg-nuumi-pink hover:bg-nuumi-pink/90 text-white"
            onClick={() => onAddToMealPlan(meal, 'lunch')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add to Plan
          </Button>
          <Button
            variant="outline"
            onClick={handleShareMeal}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MealCard;

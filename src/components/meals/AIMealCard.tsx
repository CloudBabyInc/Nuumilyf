import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Meal {
  name: string;
  description: string;
  nutritionalBenefits?: string;
  suitabilityReason?: string;
  imageEmoji: string;
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <div className="relative h-24 w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-nuumi-pink/10 to-nuumi-pink/30">
          <div className="text-6xl">{meal.imageEmoji || '🍽️'}</div>
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
          <Button 
            onClick={onSelect}
            className="w-full bg-nuumi-pink hover:bg-nuumi-pink/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Select This Meal
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default AIMealCard;
